// ExcelDateFilter.jsx
import { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

export default function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  
  // Add columns to display
  const [columns, setColumns] = useState([]);
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Parse the Excel file
        const workbook = XLSX.read(event.target.result, { type: 'binary', cellDates: true });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'DD-MM-YYYY' });
        
        if (jsonData.length === 0) {
          alert("The Excel file appears to be empty.");
          return;
        }
        
        // Extract date column if exists, or add a date column if needed
        const processedData = jsonData.map(row => {
          // Identify if there's a date column
          let dateValue = null;
          
          // Look for date patterns in each column
          for (const key in row) {
            const value = row[key];
            if (typeof value === 'string' && 
                (value.match(/\d{2}-\d{2}-\d{4}/) || value.match(/\d{2}\/\d{2}\/\d{4}/))) {
              // Extract just the date part if there's also time
              const dateParts = value.split(' ');
              dateValue = dateParts[0];
              row['ExtractedDate'] = dateValue;
              break;
            }
          }
          
          return row;
        });
        
        setData(processedData);
        setFilteredData(processedData);
        setColumns(Object.keys(processedData[0]));
        setIsDataLoaded(true);
      } catch (error) {
        alert("Error processing the file: " + error.message);
      }
    };
    
    reader.readAsBinaryString(file);
  };
  
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    
    if (!value) {
      // If filter is cleared, show all data
      setFilteredData(data);
      return;
    }
    
    // Apply date filtering
    const newFilteredData = data.filter(row => {
      // Check all columns for any matching date value
      return Object.keys(row).some(key => {
        if (typeof row[key] === 'string') {
          const cellValue = row[key].toString().toLowerCase();
          // Look for the date filter value in any column
          return cellValue.includes(value.toLowerCase());
        }
        return false;
      });
    });
    
    setFilteredData(newFilteredData);
  };

  return (
    <div className="container">
      <h1 className="main-title">Excel Date Filter</h1>
      
      <div className="upload-section">
        <div className="upload-container">
          <label className="upload-button">
            <span>Upload Excel File</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
              className="hidden-input"
            />
          </label>
        </div>
        {isDataLoaded && (
          <p className="success-message">
            Data loaded successfully! ({data.length} rows)
          </p>
        )}
      </div>

      {isDataLoaded && (
        <>
          <div className="filter-section">
            <h2 className="section-title">Filter by Date</h2>
            <div className="date-filter-container">
              <input
                type="text"
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                placeholder="Enter date (e.g., 02-01-2025)"
                className="date-filter-input"
              />
              <p className="filter-help">
                Type any part of a date to filter (day, month, year or full date)
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column} className="table-header">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}>
                      {columns.map(column => (
                        <td key={`${rowIndex}-${column}`} className="table-cell">
                          {row[column]?.toString() || ''}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="empty-message">
                      No matching data found. Try adjusting your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="results-count">
            Showing {filteredData.length} of {data.length} rows
          </div>
        </>
      )}
    </div>
  );
}