import React, { useState } from 'react';
import Papa from 'papaparse';
import api from '../utils/api';
import { useOrders } from '../context/OrderContext';

const OrderInitiator = () => {
  const [schoolName, setSchoolName] = useState('');
  const [batchName, setBatchName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { addOrder } = useOrders();

  // Process CSV file
  const processFile = (file: File) => {
    if (!file || (!file.type.includes('csv') && !file.name.endsWith('.csv'))) {
      alert("Please upload a valid CSV file.");
      return;
    }

    if (!schoolName.trim() || !batchName.trim()) {
      setValidationError("Please fill in School Name and Batch Name first.");
      return;
    }

    setValidationError('');
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Map CSV columns to expected format
        const mappedStudents = results.data.map((row: any) => ({
          name: row.name || row['Full Name'] || row['full_name'] || '',
          student_id: row.student_id || row['Student ID'] || row.studentid || '',
          grade: row.grade || row['Grade'] || row.grade_level || '',
          section: row.section || row['Section'] || ''
        })).filter((s: any) => s.name && s.student_id);

        if (mappedStudents.length === 0) {
          alert("No valid students found in CSV. Ensure columns 'name' and 'student_id' exist.");
          setIsUploading(false);
          return;
        }

        try {
          const response = await api.post('/orders/', {
            school_name: schoolName,
            batch_name: batchName,
            students: mappedStudents
          });
          addOrder(response.data);
          alert(`Batch uploaded successfully! ${mappedStudents.length} students registered.`);
        } catch (err: any) {
          alert(err.response?.data?.error || "Error uploading batch.");
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        alert("Failed to parse CSV file: " + error.message);
        setIsUploading(false);
      }
    });
  };

  // Drag Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // File input handler (click to browse)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="space-y-4">
        {/* School Name */}
        <input
          type="text"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          placeholder="School Name (e.g. STI College)"
        />

        {/* Batch Name */}
        <input
          type="text"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          placeholder="Batch Name (e.g. Grade 10 - 2026)"
        />

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
            ${isDragging
              ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
              : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
            }
            ${(!schoolName.trim() || !batchName.trim()) ? 'opacity-50' : ''}
          `}
        >
          {/* Hidden file input - positioned but doesn't intercept drops */}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={!schoolName.trim() || !batchName.trim() || isUploading}
          />

          {/* Visual feedback */}
          <div className="pointer-events-none">
            <div className="mb-4">
              <svg className={`w-12 h-12 mx-auto ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className={`font-medium ${isDragging ? 'text-indigo-600' : 'text-gray-500'}`}>
              {isUploading
                ? "Processing CSV..."
                : isDragging
                  ? "Drop your CSV file here"
                  : "Drag & Drop Student CSV or Click to Browse"
              }
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Expected columns: name, student_id, grade
            </p>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <p className="text-red-500 text-sm">{validationError}</p>
        )}
      </div>
    </div>
  );
};

export default OrderInitiator;