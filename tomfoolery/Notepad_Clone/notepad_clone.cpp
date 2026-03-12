#include <iostream>
#include <string>
#include <map>
#include <vector>
#include <algorithm> // Needed for std::remove

// notepad clone? 
// CRUD notes? 
// organize by categories/ tags? 
// search real time 

namespace Notepad_Clone {
    class Tag {
    public:
        std::vector<std::string> tags;

        void AddTag() {
            std::string new_tag;
            std::cout << "Enter a tag: ";
            std::cin >> new_tag; 
            tags.push_back(new_tag);
        }

        void ReadTag() const {
            for (const auto& tag : tags) {
                std::cout << tag << std::endl;
            }
        }

        void DeleteTag() {
            std::string user_input;
            std::cout << "What tag to delete: ";
            std::cin >> user_input;
            auto tag_remove = std::remove(tags.begin(), tags.end(), user_input);
            if (tag_remove != tags.end()) {
                tags.erase(tag_remove, tags.end());
            } else {
                std::cout << "Tag not found." << std::endl;
            }
        }
    };

    class Note {
    public:
        std::string title;
        std::string content;
        Tag tags;

        void SetTitle() {
            std::cout << "Enter a new title: ";
            std::getline(std::cin, title);
        }

        void SetContent() {
            std::cout << "Enter content for the note: ";
            std::getline(std::cin, content);
        }

        void ShowDetails() const {
            std::cout << "Title: " << title << "\nContent: " << content << std::endl;
            std::cout << "Tags: " << std::endl;
            tags.ReadTag();
        }

        void AddTag() {
            tags.AddTag(); // Delegate to Tag class
        }
    };

    class Notepad {
        std::map<std::string, Note> notes;

    public:
        void AddNote() {
            Note new_note;
            new_note.SetTitle();
            new_note.SetContent();

            notes[new_note.title] = new_note;

            std::cout << "Note added: " << new_note.title << std::endl;
        }

        Note* GetNote(const std::string &title) {
            auto it = notes.find(title);
            if (it != notes.end()) { // Corrected: use 'end()'
                return &(it->second); // Return pointer to the Note object
            }
            return nullptr; // Return null if note not found
        }

        void ShowNotes() const {
            for (const auto& pair : notes) {
                std::cout << "Note title: " << pair.first << std::endl; // Corrected: use 'std::endl'
            }
        }
    };
}

int main() {
    Notepad_Clone::Notepad notepad; // Create Notepad object

    // Example usage
    notepad.AddNote(); // User sets title and content
    Notepad_Clone::Note* note = notepad.GetNote("Your Note Title"); // Replace with actual title

    if (note) {
        note->AddTag(); // Add a tag
        note->ShowDetails(); // Show title, content, and tags
    }

    notepad.ShowNotes(); // Show all notes
    return 0;
}
