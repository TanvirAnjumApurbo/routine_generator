/**
 * pdf-template.js
 *
 * PDF / PNG Template Generator for Exam Schedule
 *
 * We removed the <html>, <head>, <body> wrappers and any <script> tags,
 * so that injecting via innerHTML will immediately apply the <style> and produce
 * a visible <div id="content-to-export">…</div> that html2canvas can snapshot.
 */

function createBeautifulTemplate(courses) {
    console.log('✅ createBeautifulTemplate function loaded successfully');    const colorClasses = [
        { name: 'blue',   border: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
        { name: 'purple', border: '#8b5cf6', bg: '#f3e8ff', text: '#7c3aed' },
        { name: 'green',  border: '#10b981', bg: '#ecfdf5', text: '#047857' },
        { name: 'orange', border: '#f97316', bg: '#fff7ed', text: '#ea580c' },
        { name: 'pink',   border: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
        { name: 'teal',   border: '#14b8a6', bg: '#f0fdfa', text: '#0f766e' }
    ];

    // Helper: Generate date range from courses
    function getDateRange(courses) {
        if (!courses || courses.length === 0) {
            return 'No dates available';
        }
        
        const dates = courses
            .map(course => course['Date'])
            .filter(date => date && date !== 'N/A')
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a - b);
        
        if (dates.length === 0) {
            return 'No valid dates';
        }
        
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        };
        
        if (startDate.getTime() === endDate.getTime()) {
            return formatDate(startDate);
        } else {
            return `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }
    }

    // Total students (if each course has a "Student" count field)
    const totalStudents = courses.reduce((sum, course) => sum + parseInt(course['Student'] || 0, 10), 0);// Helper: determine if a given start time is morning or afternoon
    function getTimeStatus(startTime) {
        if (!startTime || typeof startTime !== 'string') {
            return 'morning'; // default fallback
        }
        
        const timeParts = startTime.trim().split(' ');
        const time = timeParts[0];
        const modifier = timeParts[1];
        
        if (!time) {
            return 'morning'; // default fallback
        }
        
        let [hour, minute] = time.split(':').map(Number);
        
        // Handle AM/PM format
        if (modifier && typeof modifier === 'string') {
            const modifierLower = modifier.toLowerCase();
            if (modifierLower === 'pm' && hour !== 12) {
                hour += 12;
            }
            if (modifierLower === 'am' && hour === 12) {
                hour = 0;
            }
        }
        // If no modifier, assume 24-hour format (hour is already correct)
        
        return hour < 12 ? 'morning' : 'afternoon';
    }    // Helper: get weekday name from date
    function getWeekdayName(dateString) {
        if (!dateString || dateString === 'N/A') {
            return '';
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '';
        }
        
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return weekdays[date.getDay()];
    }
    
    // Helper: get faculty initials (first two letters from each word)
    function getFacultyInitials(fullName) {
        if (!fullName || typeof fullName !== 'string') {
            return 'N/A'; // default fallback
        }
        
        // Remove any brackets and their content first
        const cleanName = fullName.replace(/\[[^\]]*\]/g, '').trim();
        
        if (!cleanName) {
            return 'N/A';
        }
        
        const words = cleanName
            .split(' ')
            .filter(word => word && word.length > 0)
            .filter(word => !['dr', 'dr.', 'professor', 'prof', 'prof.', 'mr', 'mr.', 'ms', 'ms.', 'mrs', 'mrs.'].includes(word.toLowerCase()));
        
        if (words.length === 0) {
            return 'N/A';
        }
        
        // Take first letter of first two significant words
        const initials = words
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join('');
            
        return initials || 'N/A';
    }

    try {
        // Validate courses array
        if (!Array.isArray(courses) || courses.length === 0) {
            throw new Error('Courses data is invalid or empty.');
        }        console.log('Courses data received:', courses);
        
        // Sort courses by date
        const sortedCourses = [...courses].sort((a, b) => {
            const dateA = new Date(a['Date'] || '1900-01-01');
            const dateB = new Date(b['Date'] || '1900-01-01');
            
            // If dates are equal, sort by start time
            if (dateA.getTime() === dateB.getTime()) {
                const timeA = a['Start Time'] || '00:00';
                const timeB = b['Start Time'] || '00:00';
                
                // Convert time to 24-hour format for comparison
                const convertTo24Hour = (timeStr) => {
                    if (!timeStr) return '00:00';
                    
                    const timeParts = timeStr.trim().split(' ');
                    const time = timeParts[0];
                    const modifier = timeParts[1];
                    
                    if (!time) return '00:00';
                    
                    let [hour, minute] = time.split(':').map(Number);
                    
                    if (modifier && typeof modifier === 'string') {
                        const modifierLower = modifier.toLowerCase();
                        if (modifierLower === 'pm' && hour !== 12) {
                            hour += 12;
                        }
                        if (modifierLower === 'am' && hour === 12) {
                            hour = 0;
                        }
                    }
                    
                    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                };
                
                return convertTo24Hour(timeA).localeCompare(convertTo24Hour(timeB));
            }
            
            return dateA - dateB;
        });
        
        console.log('Courses sorted by date and time:', sortedCourses);
        
        // Generate date range from courses
        const dateRange = getDateRange(courses);
        console.log('Generated date range:', dateRange);

        // Build table rows for each course
        let tableRowsHtml = '';
        sortedCourses.forEach((course, index) => {
            console.log(`Processing course at index ${index}:`, course);
            
            // Provide default values for missing fields
            const courseTitle = course['Course Title'] || 'N/A';
            const courseCode = course['Course Code'] || 'N/A';
            const courseDate = course['Date'] || 'N/A';
            const startTime = course['Start Time'] || '9:00';
            const endTime = course['End Time'] || '10:00';
            const faculty = course['Faculty'] || 'N/A';
            
            if (!courseTitle || !courseCode || !courseDate || !startTime || !endTime || !faculty) {
                console.warn(`Warning: Some fields missing in course data:`, course);
            }            const color = colorClasses[index % colorClasses.length];
            const timeStatus = getTimeStatus(startTime);
            const facultyInitials = getFacultyInitials(faculty);
            const weekdayName = getWeekdayName(courseDate);
            const isLastRow = index === courses.length - 1;
            const borderClass = isLastRow ? '' : 'border-b border-gray-100';
            
            // Debug logging for faculty initials
            console.log(`Course ${index}: Faculty "${faculty}" -> Initials "${facultyInitials}"`);

            tableRowsHtml += `
                <tr>
                    <td class="px-4 py-4 ${borderClass}">
                        <div class="flex items-start">
                            <div class="h-10 w-1 rounded-full mr-3 mt-1" style="background-color: ${color.border};"></div>
                            <div class="cell-content text-sm font-medium text-gray-800">${courseTitle}</div>
                        </div>
                    </td>                    <td class="px-4 py-4 ${borderClass}">
                        <div class="cell-content text-sm font-medium" style="color: ${color.border};">${courseCode}</div>
                    </td>                    <td class="pl-2 py-4 pr-1 ${borderClass}">
                        <div class="cell-content text-sm text-gray-600">
                            <div>${courseDate}</div>
                            ${weekdayName ? `<div class="text-xs text-gray-500 mt-1">${weekdayName}</div>` : ''}
                        </div>
                    </td>
                    <td class="pl-2 pr-1 py-4 ${borderClass}">
                         <div class="cell-content text-sm text-gray-600">
                             <span class="status-${timeStatus}" style="background-color: transparent;">${startTime}</span> to ${endTime}
                         </div>
                     </td>
                    <td class="pl-2 pr-2 py-4 ${borderClass}">
                        <div class="cell-content text-sm text-gray-600">${faculty}</div>
                    </td>
                </tr>
            `;
        });        console.log('Table rows HTML generated successfully.');        // Return the final template
        return `<script src="https://cdn.tailwindcss.com"></script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    body {
        font-family: 'Inter', sans-serif;
        background-color: #f8fafc;
    }                
                .exam-table {
                    border-collapse: separate;
                    border-spacing: 0;
                    width: 100%;
                    table-layout: fixed;
                }
                
                .exam-table th {
                    background-color: #f8fafc;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .exam-table th:first-child {
                    border-top-left-radius: 0.5rem;
                }
                
                .exam-table th:last-child {
                    border-top-right-radius: 0.5rem;
                }
                
                .exam-table tr:last-child td:first-child {
                    border-bottom-left-radius: 0.5rem;
                }
                
                .exam-table tr:last-child td:last-child {
                    border-bottom-right-radius: 0.5rem;
                }
                
                .exam-table tr:hover td {
                    background-color: #f1f5f9;
                }
                
                /* Status indicators */
                .status-morning {
                    background-color: #dbeafe;
                    color: #1e40af;
                }
                
                .status-afternoon {
                    background-color: #fef3c7;
                    color: #92400e;
                }
                  .cell-content {
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    hyphens: auto;
                    line-height: 1.4;
                }
                
                /* Custom alignment for badge content */
                .badge-content {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 0.5rem !important;
                }
                
                .badge-content svg {
                    vertical-align: middle !important;
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                }
                
                .badge-content span {
                    vertical-align: middle !important;
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                    display: inline-block !important;
                }
                
                @media print {
                    body {
                        background-color: white;
                    }
                    .no-print {
                        display: none;
                    }
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .exam-table {
                        display: block;
                        width: 100%;
                    }
                    
                    .exam-table thead, 
                    .exam-table tbody, 
                    .exam-table th, 
                    .exam-table td, 
                    .exam-table tr {
                        display: block;
                    }
                    
                    .exam-table thead tr {
                        position: absolute;
                        top: -9999px;
                        left: -9999px;
                    }
                    
                    .exam-table tr {
                        margin-bottom: 15px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                    }
                    
                    .exam-table td {
                        border: none;
                        position: relative;
                        padding-left: 50%;
                        text-align: left;
                    }
                    
                    .exam-table td:before {
                        position: absolute;
                        top: 12px;
                        left: 12px;
                        width: 45%;
                        padding-right: 10px;
                        white-space: nowrap;
                        font-weight: 600;
                    }
                    
                    .exam-table td:nth-of-type(1):before { content: "Course Name"; }
                    .exam-table td:nth-of-type(2):before { content: "Course Code"; }
                    .exam-table td:nth-of-type(3):before { content: "Date"; }
                    .exam-table td:nth-of-type(4):before { content: "Time"; }
                    .exam-table td:nth-of-type(5):before { content: "Faculty"; }                }
            </style>            <div class="max-w-7xl mx-auto px-4" style="padding: 0.5in; background-color: white; min-height: 100vh; box-sizing: border-box;">
                <!-- Main Content -->
                <div id="content-to-export" style="width: 100%; background-color: white;">
                    <!-- University Header - Centered -->
                    <div class="flex flex-col items-center justify-center mb-8 text-center">
                        <img src="static/logo.jpg" alt="Southeast University Logo" class="w-16 h-16 mb-3 object-contain">
                        <h1 class="text-3xl font-bold text-gray-800 mb-1">Southeast University</h1>
                        <p class="text-sm text-gray-500">251/A and 252, Tejgaon Industrial Area, Dhaka-1208, Bangladesh</p>
                    </div>
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
                        <div class="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -ml-20 -mb-20"></div>
                        
                        <div class="relative z-10">
                            <h2 class="text-3xl font-bold mb-2">Spring 2025 Final Examination Schedule</h2>
                            <p class="text-blue-100">Department of Computer Science and Engineering</p>                              <div class="mt-4 flex flex-wrap items-center gap-4">
                                <div class="px-4 py-4 rounded-lg badge-content min-h-[3rem]">
                                    <img src="static\\date.png" alt="Date Icon" class="h-6 w-6" />
                                    <span class="text-sm font-medium">${dateRange}</span>
                                </div>                                <div class="px-4 py-4 rounded-lg badge-content min-h-[3rem]">
                                    <img src="static\\book.png" alt="Book Icon" class="h-6 w-6" />
                                    <span class="text-sm font-medium">${sortedCourses.length} Course${sortedCourses.length > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Exam Table -->
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                        <table class="exam-table w-full">                            <thead>
                                <tr>
                                    <th class="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200" style="width: 37%;">Course Name</th>
                                    <th class="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200" style="width: 16%;">Course Code</th>
                                    <th class="pl-2 py-4 pr-1 text-left text-sm font-semibold text-gray-700 border-b border-gray-200" style="width: 16%;">Date</th>
                                    <th class="pl-2 pr-1 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200" style="width: 11%;">Time</th>
                                    <th class="pl-2 pr-2 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200" style="width: 20%;">Faculty</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Footer -->
                    <div class="bg-gray-50 rounded-xl p-4 text-center">
                        <p class="text-gray-500 text-xs mb-0">This project is still under development, and the generated routine may contain mistakes. Examinees are requested to cross-check with the original routine for clarification.</p>
                        <p class="text-gray-500 text-xs mb-0">© 2025 Chrono Forge - All Rights Reserved</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error in createBeautifulTemplate:', error);
        throw error;
    }
}

// Export for use in other files and make it globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createBeautifulTemplate };
}

// Make the function globally available
if (typeof window !== 'undefined') {
    window.createBeautifulTemplate = createBeautifulTemplate;
}

// Debug function to check if everything is loaded
function checkLibrariesLoaded() {
    console.log('=== LIBRARY CHECK ===');
    console.log('html2canvas available:', typeof html2canvas !== 'undefined');
    console.log('jsPDF available:', typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined');
    console.log('createBeautifulTemplate available:', typeof createBeautifulTemplate !== 'undefined');
    return typeof html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined' && typeof createBeautifulTemplate !== 'undefined';
}

// Make debug function globally available
if (typeof window !== 'undefined') {
    window.checkLibrariesLoaded = checkLibrariesLoaded;
}
