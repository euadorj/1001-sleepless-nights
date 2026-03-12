import re
import csv

class AutoTextExcel:
    def __init__(self):
        self.headers = []
        self.data = [
        ]
        self.is_processed = False
        self.special_drinks = {
        }
    
    def set_headers(self):
        print("Enter values (type 'end' to finish):")
        while True:
            header_input = input()
            if header_input.lower() == 'end':
                break
            header_input = re.sub(r'[ _]', ',', header_input)
            self.headers.append(header_input)

        print("You entered:")
        for value in self.headers:
            print(value)

    def upload_data(self):
        print("Enter values (type 'end' to finish):")
        while True:
            data_input = input()
            if data_input.lower() == 'end':
                break
            self.data.append(data_input)

        print("You entered:")
        for entry in self.data:
            print(entry)

    def process_data(self):
        if self.is_processed:
            return
        pattern = re.compile(r' — | --  | / ')
        for i in range(len(self.data)):
            self.data[i] = pattern.sub(',', self.data[i])
        self.is_processed = True

    def export_data(self):
        file_name = input("Enter the name of the CSV file to export (without .csv): ") + '.csv'
        self.process_data()

        try:
            # Open the file for writing
            with open(file_name, mode='w', newline='', encoding='utf-8') as output_file:
                # Write headers
                output_file.write(','.join(self.headers) + '\n')  # Join headers without quotes
                
                # Write processed data entries
                for entry in self.data:
                    output_file.write(entry + '\n')  # Write each entry without quotes

            print(f"Data exported successfully to {file_name}")
        except Exception as e:
            print(f"Error creating file: {file_name}. Error: {str(e)}")



    def show_data(self):
        self.process_data()
        print("Headers: " + ' '.join(self.headers))
        for entry in self.data:
            print(entry)

    def main_menu(self):
        menu_options = {
            "2": self.set_headers,
            "3": self.upload_data,
            "4": self.show_data,
            "5": self.export_data,
        }

        while True:
            print("Menu:")
            print("2. Set header")
            print("3. Upload Data")
            print("4. Show Data")
            print("5. Export Data (.csv)")
            print("Type 'exit' to quit.")
            choice = input("Enter your choice (1-5 or 'exit'): ")

            if choice.lower() == 'exit':
                break

            if choice in menu_options:
                menu_options[choice]()  # Call the corresponding function
            else:
                print("Invalid choice, please enter a number between 1 and 5 or 'exit'.")


if __name__ == '__main__':
    AutoTextExcel().main_menu()
