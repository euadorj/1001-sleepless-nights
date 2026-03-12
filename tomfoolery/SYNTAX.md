i keep forgetting the syntax...

C++
            for (const auto& pair : notes) {
            } // bascially foreach i in notes 


JAVA
// print
System.out.println("Hello, World!");

//input
import java.util.Scanner;

Scanner scanner = new Scanner(System.in);
String input = scanner.nextLine();

// OOP constructor
public class MyClass {
    public MyClass(){
        //constructor
    }
}
// inheritance
class Child extends Parent

// Array/List/Dictionary
int[] arr = {1, 2, 3};
ArrayList<Integer> list = new ArrayList<>();
list.add(1);
HashMap<String, Integer> map = new HashMap<>();
map.put("key", 1);

//Function creation (Java needs u to clarify type)
public myFunction (int a, int b )

// templatting!
public <T> T add(int a, int b) { 

}

C++ 
#include <iostream>
#include <string>

// Print
std:: cout << "Hello, World!" << endl;

// Input
string input;
getline(cin, input);

//OOP
class MyClass {
public:
    MyClass() {
        // Constructor
        cout << "Constructor called!" << endl;
    }
};

// Inheritance
class Child : public Parent {

}

//Array, Vector, Map
#include <vector>
#include <map>

int arr[] = {1, 2, 3};
vector<int> vec = {1, 2, 3};
map<string, int> myMap;
myMap["key"] = 1;

// Function creation
int add(int a, int b) {
    return a + b;
}

// templating
template <typename T>
T add(T a, T b) {
    return a + b;
}

C#
using System;

// Print
Console.WriteLine("Hello, World!");

// Input
string input = Console.ReadLine();

// OOP
class MyClass {
    public MyClass() {
        // Constructor
        Console.WriteLine("Constructor called!");
    }
}

// Inheritance
class Child : Parent {}

// Array List Dictionary
int[] arr = { 1, 2, 3 };
List<int> list = new List<int> { 1, 2, 3 };
Dictionary<string, int> dict = new Dictionary<string, int>();
dict["key"] = 1;

// function creation
int Add(int a, int b) {
    return a + b;
}


// templatting (generics)
public T Add<T>(T a, T b) {
    return a; // Placeholder
}
