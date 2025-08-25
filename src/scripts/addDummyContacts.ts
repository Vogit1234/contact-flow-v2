import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const dummyContacts = [
  {
    name: "Sarah Johnson",
    title: "Marketing Director", 
    company: "TechCorp Solutions",
    email: "sarah.johnson@techcorp.com",
    mobilePhone: "+1 (555) 123-4567",
    workPhone: "+1 (555) 123-4568",
    fax: "+1 (555) 123-4569",
    website: "https://www.techcorp.com",
    address: "1234 Innovation Drive, Suite 500, San Francisco, CA 94105",
    notes: "Key contact for marketing campaigns. Prefers email communication and is available for calls between 9 AM - 5 PM PST.",
    initials: "SJ",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Michael Chen",
    title: "Senior Software Engineer",
    company: "StartupHub Inc.",
    email: "m.chen@startuphub.io",
    mobilePhone: "+1 (555) 987-6543",
    workPhone: "+1 (555) 987-6544",
    fax: "+1 (555) 987-6545",
    website: "https://www.startuphub.io",
    address: "789 Tech Boulevard, Floor 12, Austin, TX 73301",
    notes: "Lead developer for mobile applications. Expertise in React Native and Node.js. Best reached via Slack during business hours.",
    initials: "MC",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Emily Rodriguez",
    title: "VP of Sales",
    company: "Global Dynamics Corp",
    email: "emily.r@globaldynamics.com",
    mobilePhone: "+1 (555) 246-8135",
    workPhone: "+1 (555) 246-8136",
    fax: "+1 (555) 246-8137",
    website: "https://www.globaldynamics.com",
    address: "456 Business Center, Suite 200, Chicago, IL 60601",
    notes: "Handles enterprise sales and partnerships. Very responsive to calls and emails. Travels frequently - check calendar before scheduling meetings.",
    initials: "ER",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const addDummyContacts = async () => {
  try {
    console.log("Adding dummy contacts to Firestore...");
    
    const promises = dummyContacts.map(contact => 
      addDoc(collection(db, "contacts"), contact)
    );
    
    const results = await Promise.all(promises);
    
    console.log("Successfully added dummy contacts:");
    results.forEach((result, index) => {
      console.log(`- ${dummyContacts[index].name} (ID: ${result.id})`);
    });
    
    return results;
  } catch (error) {
    console.error("Error adding dummy contacts:", error);
    throw error;
  }
};

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addDummyContacts()
    .then(() => {
      console.log("✅ All dummy contacts added successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to add dummy contacts:", error);
      process.exit(1);
    });
}