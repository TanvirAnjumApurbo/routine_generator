import os
from flask import Flask, render_template, request, send_file
import pandas as pd
import re
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import io

app = Flask(__name__)

def format_date(date_str):
    """Convert date from DD.MM.YYYY to separate date and weekday components"""
    try:
        # Parse the date from DD.MM.YYYY format
        date_obj = datetime.strptime(date_str, '%d.%m.%Y')
        # Format to 'Month DD, YYYY' and get weekday separately
        formatted_date = date_obj.strftime('%B %d, %Y')
        weekday = date_obj.strftime('%A')
        return formatted_date, weekday
    except ValueError:
        # If parsing fails, return original date and empty weekday
        return date_str, ""

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        # Use get() method with default value to handle missing form field
        course_codes_input = request.form.get('course_codes', '').strip()
        
        if not course_codes_input:
            return render_template('index.html', error="Please enter at least one course code.")
          # Split by comma, semicolon, spaces, or newline and clean up
        course_codes = [code.strip().upper() for code in 
                       re.split(r'[,;\s\n]+', course_codes_input) 
                       if code.strip()]
        
        if not course_codes:
            return render_template('index.html', error="Please enter at least one course code.")
        
        if len(course_codes) > 6:
            return render_template('index.html', error="You can enter maximum 6 course codes at once.")
        
        df = pd.read_csv('exam_data.csv')
        courses_found = []
        courses_not_found = []
        
        for course_code in course_codes:
            filtered_df = df[df['Course Code'] == course_code]
            if not filtered_df.empty:                # Convert pandas Series to dictionary for Jinja2 template
                course = filtered_df.iloc[0].to_dict()
                # Format the date to look better
                formatted_date, weekday = format_date(course['Date'])
                course['Date'] = formatted_date
                course['Weekday'] = weekday
                courses_found.append(course)
            else:
                courses_not_found.append(course_code)
        
        if not courses_found and courses_not_found:
            error_msg = f"Course(s) not found: {', '.join(courses_not_found)}. Please check the course codes and try again."
            return render_template('index.html', error=error_msg)
        
        warning_msg = None
        if courses_not_found:
            warning_msg = f"Some courses not found: {', '.join(courses_not_found)}"
        
        return render_template('index.html', courses=courses_found, warning=warning_msg)

    return render_template('index.html')


@app.route('/download/<course_code>')
def download_pdf(course_code):
    """Generate and download PDF for a specific course"""
    df = pd.read_csv('exam_data.csv')
    filtered_df = df[df['Course Code'] == course_code.upper()]

    if filtered_df.empty:
        return "Course not found.", 404
      # Convert pandas Series to dictionary
    course = filtered_df.iloc[0].to_dict()
    # Format the date to look better
    formatted_date, weekday = format_date(course['Date'])
    course['Date'] = formatted_date
    course['Weekday'] = weekday

    # Convert to PDF using ReportLab
    pdf_file = io.BytesIO()
    doc = SimpleDocTemplate(pdf_file, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    title = Paragraph("EXAM ROUTINE", title_style)
    story.append(title)
    story.append(Spacer(1, 20))
    
    # Course details table
    data = [
        ['Course Code:', course['Course Code']],
        ['Course Name:', course['Course Title']],
        ['Instructor:', course['Faculty']],
        ['Date:', course['Date']],
        ['Start Time:', course['Start Time']],
        ['End Time:', course['End Time']],
        ['Room:', 'TBA']  # Room not in CSV
    ]
    
    table = Table(data, colWidths=[2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)
    doc.build(story)
    pdf_file.seek(0)

    return send_file(pdf_file, download_name=f"routine_{course_code}.pdf", as_attachment=True)


@app.route('/test')
def test_download():
    """Test page for download functionality"""
    return send_file('test_download.html')

@app.route('/debug')
def debug():
    """Debug page to test library loading"""
    return render_template('debug.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
