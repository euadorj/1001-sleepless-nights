import java.util.*;

public class InterviewAnalyzer {

    // List of standard interview questions
    private static final String[] GENERAL_QUESTIONS = {
        "1. Why this company?",
        "2. Why do you think you will be a good fit?",
        "3. What are your strengths and weaknesses?",
        "4. Describe a challenging situation and how you overcame it.",
        "5. Where do you see yourself in five years?"
    };

    // Simulated LeetCode questions
    private static final String[] LEETCODE_QUESTIONS = {
        "1. Given an array of integers, find two numbers such that they add up to a specific target.",
        "2. Reverse a linked list.",
        "3. Merge two sorted linked lists."
    };

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<String> responses = new ArrayList<>();

        // Asking general interview questions
        System.out.println("Please answer the following questions:\n");
        for (String question : GENERAL_QUESTIONS) {
            System.out.println(question);
            responses.add(scanner.nextLine());
        }

        // Asking two random LeetCode questions
        System.out.println("\nNow, let's move to some technical questions from LeetCode: In a language of your choice.\n");
        Random random = new Random();
        Set<Integer> askedIndices = new HashSet<>();

        while (askedIndices.size() < 2) {
            int index = random.nextInt(LEETCODE_QUESTIONS.length);
            if (askedIndices.add(index)) {
                System.out.println(LEETCODE_QUESTIONS[index]);
                responses.add(scanner.nextLine());
            }
        }

        // Analyzing responses
        int technicalScore = evaluateTechnicalAbility(responses);
        int yappingScore = evaluateCommunicationSkills(responses);

        // Displaying results
        System.out.println("\n--- Interview Analysis Results ---");
        System.out.printf("Technical Ability Rating: %d/100\n", technicalScore);
        System.out.printf("Yapping Ability Rating: %d/100\n", yappingScore);
        
        // Closing the scanner
        scanner.close();
    }

    // Simple keyword-based evaluation of technical ability
    private static int evaluateTechnicalAbility(List<String> responses) {
        List<String> technicalKeywords = Arrays.asList(
            "algorithm", "data structure", "complexity", "performance", 
            "optimize", "linked list", "array", "hashmap"
        );
        return calculateScore(responses, technicalKeywords);
    }

    // Simple keyword-based evaluation of yapping (communication) skills
    private static int evaluateCommunicationSkills(List<String> responses) {
        List<String> communicationKeywords = Arrays.asList(
            "problem", "solution", "collaborate", "team", 
            "success", "challenge", "growth", "experience"
        );
        return calculateScore(responses, communicationKeywords);
    }

    // Method to calculate score based on keyword occurrences
    private static int calculateScore(List<String> responses, List<String> keywords) {
        int keywordCount = 0;

        for (String response : responses) {
            for (String keyword : keywords) {
                if (response.toLowerCase().contains(keyword.toLowerCase())) {
                    keywordCount++;
                }
            }
        }

        // Normalize score to 100, taking care if no responses are provided
        return responses.isEmpty() ? 0 : Math.min((keywordCount * 100) / (responses.size() * keywords.size()), 100);
    }
}
