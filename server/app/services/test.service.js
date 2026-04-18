const Test = require("../models/Test");
const Question = require("../models/Question");
const { parseMCQFromPDF } = require("../utils/pdfParser");
const fs = require("fs");
const ErrorResponse = require("../utils/errorResponse");

/**
 * Create a new test and its questions from PDF
 */
exports.createTestFromPDF = async (testData, pdfPath, userId) => {
    try {
        const buffer = fs.readFileSync(pdfPath);
        const parsedQuestions = await parseMCQFromPDF(buffer);

        if (!parsedQuestions || parsedQuestions.length === 0) {
            throw new ErrorResponse("No questions found in the PDF. Please check the format (e.g. 1. Question... A) Option... Answer: A)", 400);
        }

        // Sum up each question's actual marks (accounts for 1/2/5 mark questions)
        const totalMarks = parsedQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

        const test = await Test.create({
            ...testData,
            createdBy: userId,
            totalMarks
        });

        const questions = parsedQuestions.map(q => ({
            ...q,
            testId: test._id
        }));

        await Question.insertMany(questions);
        
        // Clean up file
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

        return { test, questionCount: questions.length };
    } catch (err) {
        // Ensure file is deleted even if error occurs
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        
        // Propagate error
        if (err instanceof ErrorResponse) throw err;
        throw new ErrorResponse(`Error processing PDF: ${err.message}`, 400);
    }
};

/**
 * Create a new test manually
 */
exports.createTest = async (testData, userId) => {
    return await Test.create({
        ...testData,
        createdBy: userId,
        totalMarks: 0 // Initial marks
    });
};

/**
 * Manually add a question to a test
 */
exports.addQuestion = async (testId, questionData) => {
    const test = await Test.findById(testId);
    if (!test) throw new ErrorResponse("Test not found", 404);
    if (test.status === "Published") throw new ErrorResponse("Cannot modify a published test", 403);

    const question = await Question.create({
        ...questionData,
        testId: test._id
    });

    // Update total marks with numerical safety
    test.totalMarks = (test.totalMarks || 0) + (Number(question.marks) || 0);
    await test.save();

    return question;
};

/**
 * Get tests for an institution
 */
exports.getTestsByInstitution = async (institutionId, userRole) => {
    const query = { institutionId, isDeleted: false };
    if (userRole === "student") {
        query.status = "Published";
    }
    return await Test.find(query).sort({ createdAt: -1 });
};

/**
 * Get full test details with questions
 */
exports.getTestDetails = async (testId, institutionId) => {
    const test = await Test.findOne({ _id: testId, institutionId, isDeleted: false });
    if (!test) throw new ErrorResponse("Test not found", 404);

    const questions = await Question.find({ testId: test._id });
    
    // Auto-calculate total marks to ensure consistency (repairs old data)
    const actualTotalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    if (test.totalMarks !== actualTotalMarks) {
        test.totalMarks = actualTotalMarks;
        await test.save();
    }

    return { test, questions };
};

/**
 * Publish a test
 */
exports.publishTest = async (testId, institutionId) => {
    const test = await Test.findOne({ _id: testId, institutionId });
    if (!test) throw new ErrorResponse("Test not found", 404);

    test.status = "Published";
    await test.save();
    return test;
};

/**
 * Get comprehensive stats for a test (Instructor Only) using Aggregation Pipelines
 */
exports.getTestStats = async (testId, institutionId) => {
    const mongoose = require("mongoose");
    const Attempt = require("../models/Attempt");
    const User = require("../models/User");

    const test = await Test.findOne({ _id: testId, institutionId, isDeleted: false });
    if (!test) throw new ErrorResponse("Test not found", 404);

    const enrolledStudents = await User.countDocuments({ institutionId, role: "student", isActive: true });
    const testObjectId = new mongoose.Types.ObjectId(testId);

    const analytics = await Attempt.aggregate([
        { $match: { testId: testObjectId, status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
        {
            $facet: {
                // Overall summary stats
                "summary": [
                    {
                        $group: {
                            _id: null,
                            avgScore: { $avg: "$score" },
                            maxScore: { $max: "$score" },
                            minScore: { $min: "$score" },
                            totalAttempts: { $sum: 1 },
                            uniqueStudents: { $addToSet: "$studentId" },
                            stdDev: { $stdDevPop: "$score" }
                        }
                    },
                    {
                        $project: {
                            avgScore: 1,
                            maxScore: 1,
                            minScore: 1,
                            totalAttempts: 1,
                            stdDev: 1,
                            completedStudentCount: { $size: "$uniqueStudents" }
                        }
                    }
                ],
                // Score band distribution (0-40%, 40-60%, 60-80%, 80-100%)
                "scoreDistribution": [
                    {
                        $project: {
                            percentage: {
                                $cond: {
                                    if: { $gt: [test.totalMarks, 0] },
                                    then: { $multiply: [{ $divide: ["$score", test.totalMarks] }, 100] },
                                    else: 0
                                }
                            }
                        }
                    },
                    {
                        $bucket: {
                            groupBy: "$percentage",
                            boundaries: [0, 40, 60, 80, 101],
                            default: "Below 40%",
                            output: { count: { $sum: 1 } }
                        }
                    }
                ],
                // Score timeline - attempts grouped by day for trend chart
                "scoreTimeline": [
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
                            },
                            avgScore: { $avg: "$score" },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } },
                    { $limit: 30 }
                ],
                // Status breakdown
                "statusBreakdown": [
                    { $group: { _id: "$status", count: { $sum: 1 } } }
                ],
                // Per-question difficulty analysis
                "questionDifficulty": [
                    { $unwind: "$answers" },
                    {
                        $lookup: {
                            from: "questions",
                            localField: "answers.questionId",
                            foreignField: "_id",
                            as: "questionInfo"
                        }
                    },
                    { $unwind: "$questionInfo" },
                    {
                        $project: {
                            questionId: "$answers.questionId",
                            questionText: "$questionInfo.questionText",
                            marks: "$questionInfo.marks",
                            isCorrect: {
                                $cond: [
                                    { $eq: ["$answers.selectedOption", "$questionInfo.correctAnswer"] },
                                    1, 0
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$questionId",
                            questionText: { $first: "$questionText" },
                            marks: { $first: "$marks" },
                            totalAttempts: { $sum: 1 },
                            correctAttempts: { $sum: "$isCorrect" }
                        }
                    },
                    {
                        $project: {
                            questionText: 1,
                            marks: 1,
                            totalAttempts: 1,
                            correctAttempts: 1,
                            accuracyRate: {
                                $cond: [
                                    { $gt: ["$totalAttempts", 0] },
                                    { $round: [{ $multiply: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 100] }, 1] },
                                    0
                                ]
                            }
                        }
                    },
                    { $sort: { accuracyRate: 1 } }, // hardest first
                    { $limit: 10 }
                ],
                // Student details with rank
                "studentDetails": [
                    { $sort: { score: -1, submittedAt: -1 } },
                    {
                        $group: {
                            _id: "$studentId",
                            attemptId: { $first: "$_id" },
                            score: { $first: "$score" },
                            status: { $first: "$status" },
                            submittedAt: { $first: "$submittedAt" },
                            startedAt: { $first: "$startedAt" }
                        }
                    },
                    { $sort: { score: -1 } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "_id",
                            as: "studentInfo"
                        }
                    },
                    { $unwind: "$studentInfo" },
                    { $match: { "studentInfo.isActive": true } },
                    {
                        $project: {
                            attemptId: 1,
                            studentName: "$studentInfo.name",
                            studentEmail: "$studentInfo.email",
                            studentRoll: "$studentInfo.studentId",
                            profileImage: "$studentInfo.profileImage",
                            score: 1,
                            status: 1,
                            submittedAt: 1,
                            timeTaken: { $subtract: ["$submittedAt", "$startedAt"] }
                        }
                    }
                ]
            }
        }
    ]);

    const result = analytics[0];
    const summary = result.summary[0] || { avgScore: 0, totalAttempts: 0, completedStudentCount: 0, maxScore: 0, minScore: 0, stdDev: 0 };

    // Calculate unique pass count (students who passed at least once)
    const passThreshold = test.totalMarks * 0.5;
    const passStudents = await Attempt.distinct("studentId", {
        testId: testObjectId,
        status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] },
        score: { $gte: passThreshold }
    });
    const passCount = passStudents.length;

    return {
        testTitle: test.title,
        totalMarks: test.totalMarks,
        duration: test.duration,
        enrolledStudents,
        totalAttempts: summary.totalAttempts,
        completedStudentCount: summary.completedStudentCount,
        averageScore: summary.avgScore ? Number(summary.avgScore.toFixed(2)) : 0,
        maxScore: summary.maxScore || 0,
        minScore: summary.minScore || 0,
        stdDev: summary.stdDev ? Number(summary.stdDev.toFixed(2)) : 0,
        passRate: summary.completedStudentCount > 0 ? Math.round((passCount / summary.completedStudentCount) * 100) : 0,
        completionRate: enrolledStudents > 0 ? Math.min(100, Math.round((summary.completedStudentCount / enrolledStudents) * 100)) : 0,
        scoreDistribution: result.scoreDistribution,
        scoreTimeline: result.scoreTimeline,
        statusBreakdown: result.statusBreakdown,
        questionDifficulty: result.questionDifficulty,
        performance: result.studentDetails
    };
};


/**
 * Get the global leaderboard for an institution
 */
exports.getGlobalLeaderboard = async (institutionId) => {
    const Attempt = require("../models/Attempt");
    const mongoose = require("mongoose");
    
    let matchQuery = { status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] } };
    if (institutionId) {
        matchQuery.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    
    // Aggregate scores per student — only from active (non-deleted) tests
    const leaderboard = await Attempt.aggregate([
        { $match: matchQuery },
        // Join with tests to filter out archived ones
        {
            $lookup: {
                from: "tests",
                localField: "testId",
                foreignField: "_id",
                as: "testInfo"
            }
        },
        { $unwind: "$testInfo" },
        // Exclude attempts for archived or unpublished tests
        { $match: { "testInfo.isDeleted": false, "testInfo.status": "Published" } },
        {
            $group: {
                _id: "$studentId",
                totalScore: { $sum: "$score" },
                testsTaken: { $sum: 1 },
                avgScore: { $avg: "$score" }
            }
        },
        { $sort: { totalScore: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "studentInfo"
            }
        },
        { $unwind: "$studentInfo" },
        {
            $project: {
                name: "$studentInfo.name",
                studentId: "$studentInfo.studentId",
                profileImage: "$studentInfo.profileImage",
                totalScore: 1,
                testsTaken: 1,
                avgScore: { $round: ["$avgScore", 2] }
            }
        }
    ]);

    return leaderboard;
};

/**
 * Archive a test (soft delete)
 */
exports.archiveTest = async (testId, institutionId) => {
    const test = await Test.findOne({ _id: testId, institutionId });
    if (!test) throw new ErrorResponse("Test not found", 404);

    test.isDeleted = true;
    await test.save();
    return test;
};

/**
 * Restore an archived test
 */
exports.restoreTest = async (testId, institutionId) => {
    const test = await Test.findOne({ _id: testId, institutionId });
    if (!test) throw new ErrorResponse("Test not found", 404);

    test.isDeleted = false;
    await test.save();
    return test;
};

/**
 * Permanently delete a test and its questions
 */
exports.permanentDeleteTest = async (testId, institutionId) => {
    const test = await Test.findOne({ _id: testId, institutionId });
    if (!test) throw new ErrorResponse("Test not found", 404);

    // Delete all linked questions
    await Question.deleteMany({ testId: test._id });
    
    // Delete the test itself
    await test.deleteOne();
    
    return true;
};

/**
 * Get all archived tests
 */
exports.getArchivedTests = async (institutionId) => {
    return await Test.find({ institutionId, isDeleted: true }).sort({ updatedAt: -1 });
};

/**
 * Update a question's details
 */
exports.updateQuestion = async (questionId, questionData) => {
    const question = await Question.findById(questionId);
    if (!question) throw new ErrorResponse("Question not found", 404);

    const test = await Test.findById(question.testId);
    if (!test) throw new ErrorResponse("Parent test not found", 404);
    if (test.status === "Published") throw new ErrorResponse("Cannot modify a published test", 403);

    // Marks difference adjustment with numerical safety
    if (questionData.marks !== undefined) {
        test.totalMarks = (test.totalMarks || 0) - (Number(question.marks) || 0) + (Number(questionData.marks) || 0);
        await test.save();
    }

    Object.assign(question, questionData);
    await question.save();

    return question;
};

/**
 * Delete a question from a test
 */
exports.deleteQuestion = async (questionId) => {
    const question = await Question.findById(questionId);
    if (!question) throw new ErrorResponse("Question not found", 404);

    const test = await Test.findById(question.testId);
    if (test && test.status === "Published") throw new ErrorResponse("Cannot modify a published test", 403);
    if (test) {
        test.totalMarks = Math.max(0, (test.totalMarks || 0) - (Number(question.marks) || 0));
        await test.save();
    }

    await question.deleteOne();
    return true;
};
