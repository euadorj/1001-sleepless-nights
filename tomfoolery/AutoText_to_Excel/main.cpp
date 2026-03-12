#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <regex>
#include <map>
#include <functional>
#include <cctype>
#include <set>

namespace AutoTextExcel {
    std::vector<std::string> Headers = {};
    std::vector<std::string> Data = {
    };
    bool isProcessed = false; // Flag to check if data has been processed 
    const std::set<std::string> specialDrinks = {
        "teh ping", "coke zero", "ice lemon tea", "kopi O kosong", "pocari sweat"
    };

    void SetHeaders() {
        std::string header_input;
        std::cout << "Enter values (type 'end' to finish): ";

        while (true) {
            std::getline(std::cin, header_input);
            if (header_input == "end") {
                break;
            }
            std::regex pattern("[ _]");
            header_input = std::regex_replace(header_input, pattern, ",");
            Headers.push_back(header_input);
        }

        std::cout << "You entered:\n";
        for (const std::string& value : Headers) {
            std::cout << value << std::endl;
        }
    }

    void uploadData() {
        std::string data_input;
        std::cout << "Enter values (type 'end' to finish): ";

        while (true) {
            std::getline(std::cin, data_input);
            if (data_input == "end") {
                break;
            }
            Data.push_back(data_input);
        }

        std::cout << "You entered:\n";
        for (const auto& i : Data) {
            std::cout << i << std::endl;
        }
    }

    void ProcessData() {
        if (isProcessed) {
            return; 
        }
        std::regex pattern(R"( — | --  | / )");
        for (auto &entry : Data) {
            entry = std::regex_replace(entry, pattern, ",");
        }

        isProcessed = true;
    }

    void exportData() {
        std::string fileName;
        std::cout << "Enter the name of the CSV file to export (without .csv): ";
        std::getline(std::cin, fileName);
        fileName += ".csv";  // Append .csv extension

        ProcessData(); // Process the data here if not already processed

        std::ofstream outputFile(fileName);
        if (!outputFile) {
            std::cerr << "Error creating file: " << fileName << std::endl;
            return;
        }

        // Write headers to the file
        for (size_t i = 0; i < Headers.size(); ++i) {
            outputFile << Headers[i];
            if (i < Headers.size() - 1) {
                outputFile << ",";  // Add a comma after each header except the last
            }
        }
        outputFile << "\n";  // New line after headers

        // Write processed data to the file
        for (const auto& entry : Data) {
            outputFile << entry << "\n";  // Each entry in a new line
        }

        outputFile.close();
        std::cout << "Data exported successfully to " << fileName << std::endl;
    }

    void showData() {
        ProcessData(); // Ensure data is processed before showing

        std::cout << "Headers: ";
        for (const auto& header : Headers) {
            std::cout << header << " ";
        }
        std::cout << "\n";

        for (const auto& entry : Data) {
            std::cout << entry << "\n";
        }
    }

    void MainMenu() {
        std::map<std::string, std::function<void()>> menuOptions = {
            {"2", SetHeaders},
            {"3", uploadData},
            {"4", showData},
            {"5", exportData},
        };

        std::string choice;

        while (true) {
            std::cout << "Menu:\n";
            std::cout << "2. Set header\n";
            std::cout << "3. Upload Data\n";
            std::cout << "4. Show Data\n";
            std::cout << "5. Export Data (.csv)\n";
            std::cout << "Type 'exit' to quit.\n";
            std::cout << "Enter your choice (1-5 or 'exit'): ";

            std::getline(std::cin, choice);

            if (choice == "exit") {
                break; // Exit the loop
            }

            // Use map lookup to call the appropriate function
            auto it = menuOptions.find(choice);
            if (it != menuOptions.end()) {
                it->second(); // Call the function
            } else {
                std::cout << "Invalid choice, please enter a number between 1 and 5 or 'exit'." << std::endl;
            }
        }
    }
}

int main() {
    AutoTextExcel::MainMenu();
    return 0;
}




// I have a few questions, help me debug 
// 1. what if the user sends a file that is not meant to be used for making into a excel? ie notes how would the program read and give error message ? program needs to be able to read and give feedback to user if the file they sent is viable for making into a excel
// 2. what if the user sends the whole list using uploadData? the program needs to be able to recognise what the headers are in the list and generate the headers, because assume that the user is lazy and does not want to/ does not know of the categories at the start. 
// 3. when I export, the spacing between elements and graphical view is not the same as viewData. 

// give me sample data and example of how it would work 

// data should be separated by spaces AFTER processing. do not hardcode the header nor the data 
// the whole point is for the program to automatically generate the header after user has copy pasted their text list inside
// after copy paste text list, ask user 1. what headers they want 2. what their exportted file name will be 
// 

// should display message warning the user that this text is not viable a sample would be like 
// “Seek me and live!”
// “Don’t go into the cities for they will be destroyed and go into exile”

// Samuel — preached in the circuit 
// Isaiah 55:6-7 
// Seek the Lord while He may be found. 
// Let Him turn to the Lord, and He will have mercy on Him, and to Our God, for He will surely pardon.”

// Seek His ways and walk in them 

// this should not be able to be parsed into a excel file because the textual content does not make it possible for it to be parsed

/* 
an example would be this: 
SPB
Chayce (Silas) — teh ping 
Austen — kopi O kosong 
kentzo — Pokka green tea 
Caleb — Pokka green tea 
Brandon — cold water / Pocari sweat

given this as sample data:
ask user what headers they want: (user input in LG Name drink1 drink2)
as output.csv (for example)

print out the data after being processed through processdata.
since all of the names belong to SPB, ask user if they want to fill in the 'LG' column with SPB for all members in SPB

LG Name drink1 drink2
SPB
SPB etcetc 
SPB
SPB
SPB



u need to run this 
cd AutoText_to_Excel
g++ -o main main.cpp
./main
*/

