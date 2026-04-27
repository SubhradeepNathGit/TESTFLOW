import React from 'react';
import { cn } from '../../utils/cn';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn("animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.05]", className)}
            {...props}
        />
    );
};

export const CardSkeleton = () => (
    <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[32px] p-8 shadow-none flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div className="w-full bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none overflow-hidden">
        <div className="flex gap-4 px-8 py-6 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="divide-y divide-slate-50 dark:divide-white/5">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-8 py-5 items-center">
                    <div className="flex gap-4 items-center w-1/4">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            ))}
        </div>
    </div>
);

export default Skeleton;
