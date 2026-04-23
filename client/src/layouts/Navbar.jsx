import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Menu, X } from 'lucide-react';
import SearchBar from '../components/common/SearchBar';

const Navbar = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAddProduct = () => {
    navigate('/instructor-dashboard');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors"
          >
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span className="hidden sm:inline">TestFlow</span>
            <span className="sm:hidden">TF</span>
          </Link>

          {/* New Test Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Test
            </button>
          </div>

          {}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {}
            <div className="mb-4">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>

            {/* Mobile Actions */}
            <div className="space-y-2">
              <button
                onClick={handleAddProduct}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                New Test
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
