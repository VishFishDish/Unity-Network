#Imports all necessary modules
from flask import Flask, request, jsonify, render_template
import sqlite3
from datetime import datetime
import os
import re

app = Flask(__name__)

#Database connection
def get_db_connection():
    conn = sqlite3.connect('partners.db')
    conn.row_factory = sqlite3.Row
    return conn

#Database initialization
def init_db():
    with get_db_connection() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS partners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                resources TEXT,
                contact_info TEXT
            );
        ''')
    if not os.path.exists('backups'):
        os.makedirs('backups')

#Input validation: Regular expression pattern for validating email addresses
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

#Input Validation: Regular expression pattern for validating phone numbers (10 digits)
PHONE_REGEX = re.compile(r'^\d{10}$')

#Automatic Database backup
def backup_db():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    os.system(f'cp partners.db backups/partners_backup_{timestamp}.db')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '').strip()
    conn = get_db_connection()
    if not query:
        partners = conn.execute('SELECT * FROM partners').fetchall()
    else:
        partners = conn.execute('SELECT * FROM partners WHERE name LIKE ? OR type LIKE ? OR resources LIKE ? OR contact_info LIKE ?', ('%' + query + '%', '%' + query + '%', '%' + query + '%', '%' + query + '%',)).fetchall()
    conn.close()
    return jsonify([dict(partner) for partner in partners])

@app.route('/add_partner', methods=['POST'])
def add_partner():
    data = request.get_json()

    #Syntactic validation for errors
    if not all(key in data for key in ['name', 'type', 'resources', 'contact_info']):
        return jsonify({'error': 'Missing required fields'}), 400

    #Semantic validation for errors
    contact_info = data['contact_info']
    if not EMAIL_REGEX.match(contact_info) and not PHONE_REGEX.match(contact_info):
        return jsonify({'error': 'Invalid contact information format'}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO partners (name, type, resources, contact_info) VALUES (?, ?, ?, ?)',
                 (data['name'], data['type'], data['resources'], contact_info))
    conn.commit()
    conn.close()
    backup_db()
    return jsonify({'success': 'Partner added successfully'})

@app.route('/qa', methods=['GET'])
def qa():
    #Q&A endpoint using simple pattern matching.
    question = request.args.get('question', '').lower()

    #Use simple pattern matching to generate an answer
    answer = generate_answer(question)

    return jsonify({'answer': answer})

def generate_answer(question):
    #Convert the question to lowercase for easier comparison
    question = question.lower()

    #Initialize an empty response
    response = ''

    #Check for keywords in the question and generate a response accordingly
    if 'purpose' in question:
        response = "This program is designed to collect and store information about business and community partners for the Career and Technical Education Department at our school."

    elif 'information' in question or 'details' in question:
        response = "The program stores details such as the type of organization, available resources, and direct contact information for individuals associated with the partners."
    
    elif 'add' in question and 'partner' in question:
        response = "To add partners, use the navigation system to move to the first page where you will find all the information on adding partners."

    elif 'organizations' in question:
        response = "The program includes information about at least 25 different partners, including various businesses and community organizations."

    elif 'search' in question or 'filter' in question or 'partners' in question:
        response = "Users can search and filter partner information based on criteria such as organization type, available resources, or contact information."

    elif 'how to' in question or 'operate' in question or 'use' in question:
        response = "To operate the site, you can navigate through different sections using the dropdown menu on the top. You can add a new partner by filling out the form in the 'Add a New Partner' section. To search for partners, use the search bar in the 'Search/Filter' section. If you have any specific questions or need assistance, feel free to ask!"

    else:
        response = "I'm sorry, I don't have information on that topic. Please ask a different question."

    return response

@app.route('/manual_backup', methods=['POST'])
def manual_backup():
    #Manually trigger a backup.
    backup_db()
    return jsonify({'success': 'Data backup performed successfully'})

#Route to handle partner deletion
@app.route('/delete-partner/<int:partner_id>', methods=['DELETE'])
def delete_partner(partner_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM partners WHERE id = ?', (partner_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Partner deleted successfully'})



if __name__ == '__main__':
    init_db()  #Initialize the database directly here
    app.run(debug=True)