import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

class Tag {
    private List<String> tags;

    public Tag() {
        tags = new ArrayList<>();
    }

    public void addTag(Scanner scanner) {
        System.out.print("Enter a tag: ");
        String newTag = scanner.nextLine();
        tags.add(newTag);
    }

    public void readTags() {
        for (String tag : tags) {
            System.out.println(tag);
        }
    }

    public void deleteTag(Scanner scanner) {
        System.out.print("What tag to delete: ");
        String userInput = scanner.nextLine();
        if (tags.remove(userInput)) {
            System.out.println("Tag deleted.");
        } else {
            System.out.println("Tag not found.");
        }
    }
}

class Note {
    private String title;
    private String content;
    private Tag tags;

    public Note() {
        tags = new Tag();
    }

    public void setTitle(Scanner scanner) {
        System.out.print("Enter a new title: ");
        title = scanner.nextLine();
    }

    public void setContent(Scanner scanner) {
        System.out.print("Enter content for the note: ");
        content = scanner.nextLine();
    }

    public void showDetails() {
        System.out.println("Title: " + title);
        System.out.println("Content: " + content);
        System.out.println("Tags: ");
        tags.readTags();
    }

    public String getTitle() {
        return title;
    }

    public Tag getTags() {
        return tags;
    }
}

class Notepad {
    private Map<String, Note> notes;

    public Notepad() {
        notes = new HashMap<>();
    }

    public void addNote(Scanner scanner) {
        Note newNote = new Note();
        newNote.setTitle(scanner);
        newNote.setContent(scanner);
        notes.put(newNote.getTitle(), newNote);
        System.out.println("Note added: " + newNote.getTitle());
    }

    public Note getNote(String title) {
        return notes.get(title);
    }

    public void showNotes() {
        for (String title : notes.keySet()) {
            System.out.println("Note title: " + title);
        }
    }
}

public class NotepadClone {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Notepad notepad = new Notepad();

        // Example usage
        notepad.addNote(scanner);
        System.out.print("Enter the title of the note you'd like to access: ");
        String title = scanner.nextLine();
        Note note = notepad.getNote(title);

        if (note != null) {
            note.getTags().addTag(scanner);  // Add a tag
            note.showDetails();               // Show title, content, and tags
        } else {
            System.out.println("Note not found.");
        }

        notepad.showNotes();  // Show all notes
        scanner.close();
    }
}
