import React, { useState } from 'react';
import Papa from 'papaparse';
import api from '../utils/api';
import { useOrders } from '../context/OrderContext';

const OrderInitiator = () => {
  const [schoolName, setSchoolName] = useState('');
  const [batchName, setBatchName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { addOrder } = useOrders();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await api.post('/orders/', {
            school_name: schoolName,
            batch_name: batchName,
            students: results.data // The JSON array from CSV
          });
          addOrder(response.data);
          alert("Batch uploaded and students registered!");
        } catch (err) {
          alert("Error uploading batch. Check your CSV format.");
        } finally {
          setIsUploading(false);
        }
      }
    });
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="space-y-4">
        <input 
          className="w-full p-3 border rounded-lg" 
          placeholder="School Name (e.g. STI College)" 
          onChange={e => setSchoolName(e.target.value)} 
        />
        <input 
          className="w-full p-3 border rounded-lg" 
          placeholder="Batch Name (e.g. Grade 10 - 2026)" 
          onChange={e => setBatchName(e.target.value)} 
        />
        <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-indigo-400 transition-colors">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={!schoolName || !batchName || isUploading}
          />
          <p className="text-gray-500 font-medium">
            {isUploading ? "Processing CSV..." : "Drag & Drop Student CSV or Click to Browse"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderInitiator;