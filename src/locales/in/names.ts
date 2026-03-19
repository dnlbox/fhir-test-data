import type { NamePool } from "@/core/types.js";

// Indian names from major language groups: Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam
export const inNamePool: NamePool = {
  given: {
    male: [
      // Hindi/North Indian
      "Rahul", "Amit", "Vijay", "Suresh", "Ramesh", "Rajesh", "Arun",
      "Manoj", "Sanjay", "Deepak", "Rakesh", "Ajay", "Ankit", "Ravi",
      // South Indian
      "Karthik", "Arjun", "Venkatesh", "Subramaniam", "Balaji", "Rajan",
      "Pradeep", "Srinivas", "Mohan", "Ravi", "Ganesh", "Shankar",
      // Bengali/East Indian
      "Souvik", "Subhash", "Debashis", "Arnab", "Sougata",
      // Pan-Indian
      "Rohan", "Nikhil", "Varun", "Akash", "Vivek", "Abhishek",
      "Manish", "Ashish", "Gaurav", "Harish",
    ],
    female: [
      // Hindi/North Indian
      "Priya", "Sunita", "Anita", "Kavita", "Rekha", "Geeta", "Meena",
      "Pooja", "Neha", "Shweta", "Aarti", "Anjali", "Divya", "Nisha",
      // South Indian
      "Lakshmi", "Meenakshi", "Padmini", "Gayathri", "Kavitha", "Srividya",
      "Annapurna", "Savitha", "Revathi", "Nalini", "Radha",
      // Bengali/East Indian
      "Madhuri", "Suparna", "Mousumi", "Barnali",
      // Pan-Indian
      "Shreya", "Preeti", "Swati", "Ritu", "Isha", "Tanvi",
      "Pallavi", "Sonal", "Megha", "Aditi",
    ],
  },
  family: [
    "Sharma", "Patel", "Singh", "Kumar", "Reddy", "Nair", "Iyer",
    "Das", "Gupta", "Joshi", "Mishra", "Verma", "Mehta", "Shah",
    "Bose", "Chatterjee", "Mukherjee", "Banerjee", "Ghosh", "Sen",
    "Rao", "Naidu", "Krishnamurthy", "Pillai", "Menon", "Varma",
    "Chowdhury", "Dey", "Roy", "Mandal", "Biswas", "Saha",
    "Kulkarni", "Desai", "Jain", "Agarwal", "Srivastava", "Tiwari",
    "Pandey", "Yadav", "Chauhan", "Thakur", "Malhotra", "Kapoor",
    "Bhat", "Kaur", "Shetty", "Hegde",
  ],
};
