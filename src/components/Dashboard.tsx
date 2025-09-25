import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  Database,
  Download,
  Edit,
  Globe,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useIPRestriction } from "../contexts/IPRestrictionContext";
import { useToastContext } from "../contexts/ToastContext";
import { db, functions } from "../lib/firebase";
import type { Contact, User as FirebaseUser } from "../lib/types";
import AddContactModal from "./AddContactModal";
import AddUserModal from "./AddUserModal";
import DeleteAllContactsModal from "./DeleteAllContactsModal";
import DeleteContactModal from "./DeleteContactModal";
import DeleteUserConfirmModal from "./DeleteUserConfirmModal";
import DeleteUserModal from "./DeleteUserModal";

// Using FirebaseUser from types.ts instead of local interface

export default function Dashboard() {
  const { logout, userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToastContext();
  const { ipSettings, updateIPSettings } = useIPRestriction();

  // Helper functions for role-based permissions
  const canEdit = useCallback(
    () => userProfile?.role === "Edit" || userProfile?.role === "Admin",
    [userProfile?.role]
  );
  const canDelete = useCallback(
    () => userProfile?.role === "Edit" || userProfile?.role === "Admin",
    [userProfile?.role]
  );
  const canAdmin = useCallback(
    () => userProfile?.role === "Admin",
    [userProfile?.role]
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [isDeleteContactModalOpen, setIsDeleteContactModalOpen] =
    useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<FirebaseUser | null>(null);
  const [isDeleteUserConfirmModalOpen, setIsDeleteUserConfirmModalOpen] =
    useState(false);
  const [userToDelete, setUserToDelete] = useState<FirebaseUser | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserRole, setEditingUserRole] = useState("");
  const [editingUserPassword, setEditingUserPassword] = useState("");
  const [isDeleteAllContactsModalOpen, setIsDeleteAllContactsModalOpen] =
    useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [ipRangesText, setIpRangesText] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
      success("Logout Successful", "You have been logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      showError("Logout Error", "There was an error logging out");
      navigate("/", { replace: true });
    }
  };

  const loadContacts = useCallback(async () => {
    if (!currentUser) return;

    setLoadingContacts(true);
    try {
      const contactsQuery = query(
        collection(db, "contacts"),
        orderBy("name", "asc")
      );
      const querySnapshot = await getDocs(contactsQuery);
      const contactsData: Contact[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Contact[];

      setContacts(contactsData);
    } catch (error) {
      console.error("Error loading contacts:", error);
      showError(
        "Load Error",
        "Failed to load contacts. Please refresh the page."
      );
    } finally {
      setLoadingContacts(false);
    }
  }, [currentUser, showError]);

  const loadUsers = useCallback(async () => {
    if (!currentUser || !canAdmin()) return;

    setLoadingUsers(true);
    try {
      const usersQuery = query(
        collection(db, "users"),
        orderBy("email", "asc")
      );
      const querySnapshot = await getDocs(usersQuery);
      const usersData: FirebaseUser[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as FirebaseUser[];

      // Filter out deleted users from the UI
      const activeUsers = usersData.filter((user) => user.status !== "Deleted");
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      showError("Load Error", "Failed to load users. Please refresh the page.");
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser, showError]);

  useEffect(() => {
    if (currentUser) {
      loadContacts();
      loadUsers();
    }
  }, [currentUser, loadContacts, loadUsers]);

  // Reset activeTab to contacts if user is not admin and tries to access admin
  useEffect(() => {
    if (userProfile && !canAdmin() && activeTab === "admin") {
      setActiveTab("contacts");
    }
  }, [userProfile, activeTab, canAdmin]);

  // Sync IP ranges text with IP settings
  useEffect(() => {
    if (ipSettings?.allowedRanges) {
      setIpRangesText(ipSettings.allowedRanges.join("\n"));
    }
  }, [ipSettings?.allowedRanges]);

  // Update selected contact when contacts list changes
  useEffect(() => {
    if (selectedContact && contacts.length > 0) {
      const updatedSelectedContact = contacts.find(
        (contact) => contact.id === selectedContact.id
      );
      if (updatedSelectedContact) {
        setSelectedContact(updatedSelectedContact);
      } else {
        // Contact was deleted, clear selection
        setSelectedContact(null);
      }
    }
  }, [contacts, selectedContact]);

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.title?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.address?.toLowerCase().includes(query) ||
      contact.notes?.toLowerCase().includes(query)
    );
  });

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditContactModalOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact);
    setIsDeleteContactModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingContact) return;

    try {
      await deleteDoc(doc(db, "contacts", deletingContact.id));

      success(
        "Contact Deleted",
        `${deletingContact.name} has been deleted successfully`
      );

      // If the deleted contact was selected, clear the selection
      if (selectedContact?.id === deletingContact.id) {
        setSelectedContact(null);
      }

      // Refresh the contacts list
      loadContacts();

      // Reset the deleting contact state
      setDeletingContact(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      showError("Delete Failed", "Failed to delete contact. Please try again.");
    }
  };

  const handleEditUser = (
    userId: string,
    currentRole: string,
    currentPassword: string
  ) => {
    setEditingUserId(userId);
    setEditingUserRole(currentRole);
    setEditingUserPassword(currentPassword);
  };

  const handleSaveUser = async (
    userId: string,
    newRole: string,
    newPassword: string
  ) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const updates: { role?: string; updatedAt?: Date } = {};
      let shouldUpdateFirestore = false;
      let shouldUpdatePassword = false;

      // Check if role changed
      if (newRole !== user.role) {
        updates.role = newRole;
        shouldUpdateFirestore = true;
      }

      // Check if password changed
      if (newPassword !== user.password) {
        if (newPassword.length < 6) {
          showError(
            "Validation Error",
            "Password must be at least 6 characters long"
          );
          return;
        }
        shouldUpdatePassword = true;
      }

      // Update password using Cloud Function if changed (v2 format)
      if (shouldUpdatePassword) {
        const updatePasswordFunction = httpsCallable(
          functions,
          "updateUserPassword"
        );
        console.log("Updating password for user:", user.email); // Debug log
        await updatePasswordFunction({
          email: user.email,
          newPassword: newPassword,
        });
      }

      // Update role in Firestore if changed
      if (shouldUpdateFirestore) {
        updates.updatedAt = new Date();
        await updateDoc(doc(db, "users", userId), updates);
      }

      success("User Updated", "User has been updated successfully");

      // Update the user in the local state
      setUsers(
        users.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: newRole as "Admin" | "Edit" | "View",
                password: newPassword,
                updatedAt: new Date(),
              }
            : u
        )
      );

      setEditingUserId(null);
      setEditingUserRole("");
      setEditingUserPassword("");
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update user. Please try again.";
      showError("Update Failed", errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserRole("");
    setEditingUserPassword("");
  };

  const confirmDeactivateUser = async () => {
    if (!deletingUser) return;

    try {
      await updateDoc(doc(db, "users", deletingUser.id), {
        status: "Inactive",
        updatedAt: new Date(),
      });

      success(
        "User Deactivated",
        `${deletingUser.email} has been deactivated successfully`
      );

      // Update the user in the local state
      setUsers(
        users.map((user) =>
          user.id === deletingUser.id
            ? {
                ...user,
                status: "Inactive" as "Active" | "Inactive",
                updatedAt: new Date(),
              }
            : user
        )
      );

      // Reset the deleting user state
      setDeletingUser(null);
    } catch (error) {
      console.error("Error deactivating user:", error);
      showError(
        "Deactivate Failed",
        "Failed to deactivate user. Please try again."
      );
    }
  };

  const handleDeleteAllContacts = () => {
    setIsDeleteAllContactsModalOpen(true);
  };

  const confirmDeleteAllContacts = async () => {
    try {
      const batch = writeBatch(db);

      // Get all contacts and delete them in a batch
      const contactsQuery = query(collection(db, "contacts"));
      const querySnapshot = await getDocs(contactsQuery);

      querySnapshot.docs.forEach((contactDoc) => {
        batch.delete(contactDoc.ref);
      });

      await batch.commit();

      success(
        "All Contacts Deleted",
        `Successfully deleted ${contacts.length} contacts`
      );

      // Clear local state
      setContacts([]);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error deleting all contacts:", error);
      showError(
        "Delete Failed",
        "Failed to delete all contacts. Please try again."
      );
    }
  };

  const handleImportCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    event.target.value = "";

    if (!file.type.includes("csv") && !file.name.endsWith(".csv")) {
      showError("Invalid File", "Please select a CSV file");
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      console.log("Raw CSV text:", text.substring(0, 500)); // Log first 500 chars
      const lines = text.split("\n").filter((line) => line.trim());
      console.log("Total lines found:", lines.length);
      console.log("First few lines:", lines.slice(0, 3));

      if (lines.length < 2) {
        showError(
          "Import Failed",
          "CSV file must contain headers and at least one contact"
        );
        return;
      }

      // Parse CSV headers - handle quoted values properly
      const parseCSVRow = (row: string): string[] => {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          const nextChar = row[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVRow(lines[0]).map((header) =>
        header.replace(/^"|"$/g, "").trim().toLowerCase()
      );

      console.log("Parsed headers:", headers);

      // Expected header mappings - support multiple variations
      const headerMap: Record<string, string> = {
        name: "name",
        "full name": "name",
        "contact name": "name",
        title: "title",
        "job title": "title",
        position: "title",
        company: "company",
        "company name": "company",
        organization: "company",
        email: "email",
        "email address": "email",
        "e-mail": "email",
        "mobile phone": "mobilePhone",
        mobile: "mobilePhone",
        "cell phone": "mobilePhone",
        cell: "mobilePhone",
        phone: "mobilePhone",
        "work phone": "workPhone",
        "office phone": "workPhone",
        "business phone": "workPhone",
        fax: "fax",
        "fax number": "fax",
        website: "website",
        "website url": "website",
        "web site": "website",
        url: "website",
        address: "address",
        "street address": "address",
        "mailing address": "address",
        notes: "notes",
        comments: "notes",
        description: "notes",
      };

      console.log("Available header mappings:", Object.keys(headerMap));

      // Debug header matching
      headers.forEach((header) => {
        const fieldName = headerMap[header];
        console.log(`Header "${header}" maps to field "${fieldName}"`);
      });

      // Parse contacts from CSV
      const contacts = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVRow(lines[i]).map((value) =>
            value.replace(/^"|"$/g, "").trim()
          );

          if (values.length < headers.length) continue;

          const contact: any = {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: currentUser?.uid || "",
          };

          // Map CSV columns to contact fields
          headers.forEach((header, index) => {
            const fieldName = headerMap[header];
            const value = values[index];
            if (fieldName) {
              contact[fieldName] = value || ""; // Include empty values too
              if (header === "website" || fieldName === "website") {
                console.log(
                  `Website field debug - Header: "${header}", FieldName: "${fieldName}", Value: "${value}"`
                );
              }
            }
          });

          console.log(`Row ${i + 1} contact:`, contact);

          // Validate required fields
          if (!contact.name || !contact.email) {
            errors.push(
              `Row ${
                i + 1
              }: Missing required fields (name, email) - got: ${JSON.stringify(
                contact
              )}`
            );
            console.log(`Row ${i + 1} validation failed:`, {
              name: contact.name,
              email: contact.email,
              headers,
              values,
            });
            continue;
          }

          // Generate initials if not provided
          if (!contact.initials && contact.name) {
            contact.initials = contact.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
          }

          contacts.push(contact);
        } catch {
          errors.push(`Row ${i + 1}: Invalid data format`);
        }
      }

      if (contacts.length === 0) {
        const errorDetails =
          errors.length > 0
            ? errors.slice(0, 3).join("; ")
            : "Unknown parsing error";
        showError(
          "Import Failed",
          `No valid contacts found in CSV file. Errors: ${errorDetails}`
        );
        console.log("All errors:", errors);
        console.log("Headers found:", headers);
        return;
      }

      // Import contacts to Firestore
      const batch = writeBatch(db);
      contacts.forEach((contact) => {
        const docRef = doc(collection(db, "contacts"));
        batch.set(docRef, contact);
      });

      await batch.commit();

      let message = `Successfully imported ${contacts.length} contacts`;
      if (errors.length > 0) {
        message += `. ${errors.length} rows had errors.`;
      }

      success("Import Successful", message);

      // Refresh contacts list
      loadContacts();
    } catch (error) {
      console.error("Error importing contacts:", error);
      showError(
        "Import Failed",
        "Failed to import CSV file. Please check the file format."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const exportContactsToCSV = () => {
    try {
      if (contacts.length === 0) {
        showError("Export Failed", "No contacts available to export");
        return;
      }

      // Helper function to strip HTML tags and convert to plain text while preserving line breaks
      const stripHtmlTags = (html: string): string => {
        if (!html) return "";

        // Replace paragraph tags with newlines
        let text = html.replace(/<\/p>/gi, "\n").replace(/<p[^>]*>/gi, "");

        // Replace line break tags with newlines
        text = text.replace(/<br[^>]*>/gi, "\n");

        // Remove all remaining HTML tags
        text = text.replace(/<[^>]*>/g, "");

        // Decode HTML entities
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = text;
        text = tempDiv.textContent || tempDiv.innerText || "";

        // Clean up excessive newlines (more than 2 consecutive)
        text = text.replace(/\n{3,}/g, "\n\n");

        // Trim whitespace
        return text.trim();
      };

      // Define CSV headers
      const headers = [
        "Name",
        "Title",
        "Company",
        "Email",
        "Mobile Phone",
        "Work Phone",
        "Fax",
        "Website",
        "Address",
        "Notes",
        "Created Date",
      ];

      // Convert contacts to CSV format
      const csvData = contacts.map((contact) => [
        contact.name || "",
        contact.title || "",
        contact.company || "",
        contact.email || "",
        contact.mobilePhone || "",
        contact.workPhone || "",
        contact.fax || "",
        contact.website || "",
        contact.address || "",
        stripHtmlTags(contact.notes || ""),
        contact.createdAt
          ? new Date(contact.createdAt).toLocaleDateString()
          : "",
      ]);

      console.log("CSV Data Preview:", csvData);

      // Combine headers and data
      const allData = [headers, ...csvData];

      // Convert to CSV string
      const csvContent = allData
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `contacts_export_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        success(
          "Export Successful",
          `Exported ${contacts.length} contacts to CSV file`
        );
      }
    } catch (error) {
      console.error("Error exporting contacts:", error);
      showError(
        "Export Failed",
        "Failed to export contacts. Please try again."
      );
    }
  };

  const addDummyContacts = async () => {
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
        notes:
          "Key contact for marketing campaigns. Prefers email communication and is available for calls between 9 AM - 5 PM PST.",
        initials: "SJ",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || "",
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
        notes:
          "Lead developer for mobile applications. Expertise in React Native and Node.js. Best reached via Slack during business hours.",
        initials: "MC",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || "",
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
        notes:
          "Handles enterprise sales and partnerships. Very responsive to calls and emails. Travels frequently - check calendar before scheduling meetings.",
        initials: "ER",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || "",
      },
    ];

    try {
      const promises = dummyContacts.map((contact) =>
        addDoc(collection(db, "contacts"), contact)
      );

      await Promise.all(promises);

      success(
        "Dummy Contacts Added",
        "Successfully added 3 dummy contacts to the database"
      );

      // Refresh contacts list
      loadContacts();
    } catch (error) {
      console.error("Error adding dummy contacts:", error);
      showError(
        "Add Failed",
        "Failed to add dummy contacts. Please try again."
      );
    }
  };

  const toggleUserStatus = async (user: FirebaseUser) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    const actionText = newStatus === "Active" ? "activated" : "deactivated";

    try {
      await updateDoc(doc(db, "users", user.id), {
        status: newStatus,
        updatedAt: new Date(),
      });

      success(
        `User ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
        `${user.email} has been ${actionText} successfully`
      );

      // Update the user in the local state
      setUsers(
        users.map((u) =>
          u.id === user.id
            ? { ...u, status: newStatus, updatedAt: new Date() }
            : u
        )
      );
    } catch (error) {
      console.error(
        `Error ${actionText
          .replace("activated", "activating")
          .replace("deactivated", "deactivating")} user:`,
        error
      );
      showError(
        `${
          actionText.charAt(0).toUpperCase() +
          actionText
            .slice(1)
            .replace("activated", "Activate")
            .replace("deactivated", "Deactivate")
        } Failed`,
        `Failed to ${actionText
          .replace("activated", "activate")
          .replace("deactivated", "deactivate")} user. Please try again.`
      );
    }
  };

  const handleDeleteUser = (user: FirebaseUser) => {
    setUserToDelete(user);
    setIsDeleteUserConfirmModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    // Validate that we have an email
    if (!userToDelete.email) {
      showError("Delete Failed", "User email is missing. Cannot delete user.");
      return;
    }

    try {
      console.log("Deleting user object:", userToDelete); // Debug log
      console.log("User email specifically:", userToDelete.email); // Debug log
      console.log("Email type:", typeof userToDelete.email); // Debug log

      // Ensure email is a string and not empty
      const emailToDelete = String(userToDelete.email || "").trim();
      if (!emailToDelete) {
        showError("Delete Failed", "User email is empty or invalid.");
        return;
      }

      // Call the deleteUser Cloud Function with explicit data structure (v2 format)
      const deleteUserFunction = httpsCallable(functions, "deleteUser");
      console.log("Sending data to Cloud Function:", { email: emailToDelete }); // Debug log

      const result = await deleteUserFunction({ email: emailToDelete });
      console.log("Delete user result:", result.data); // Debug log

      success(
        "User Deleted",
        `${userToDelete.email} has been permanently deleted from both Firestore and Firebase Auth.`
      );

      // Remove the user from the local state (hide from UI)
      setUsers(users.filter((u) => u.id !== userToDelete.id));

      // Reset state
      setUserToDelete(null);
      setIsDeleteUserConfirmModalOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete user. Please try again.";
      showError("Delete Failed", errorMessage);
    }
  };

  return (
    <>
      {/* <EmailForm /> */}
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Address Book
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userProfile?.email?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm text-gray-700">
                  {userProfile?.email || "User"}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {userProfile?.role || "User"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r flex flex-col min-h-0">
            {/* Search */}
            <div className="p-4 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b flex-shrink-0">
              <button
                onClick={() => setActiveTab("contacts")}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "contacts"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Contacts</span>
              </button>
              {canAdmin() && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "admin"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              )}
            </div>

            {/* Static Add Contact Button */}
            {activeTab === "contacts" && canEdit() && (
              <div className="p-4 border-b flex-shrink-0">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setIsAddContactModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            )}

            {/* Content List - Now properly scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {activeTab === "contacts" ? (
                <>
                  {loadingContacts ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-sm text-gray-500">
                        Loading contacts...
                      </div>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2">
                          No contacts found
                        </div>
                        {!canEdit() && (
                          <div className="text-sm text-gray-400">
                            Contact your administrator to add contacts
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedContact?.id === contact.id
                            ? "bg-blue-50 border-r-2 border-blue-600"
                            : ""
                        }`}
                      >
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {contact.name?.charAt(0)?.toUpperCase() || "C"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {contact.company}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Admin settings are displayed in the main panel</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === "contacts" ? (
              <div className="flex-1 min-h-0">
                {selectedContact ? (
                  <div className="h-full flex flex-col min-h-0 p-6">
                    {/* Contact Header */}
                    <div className="flex items-start justify-between mb-8 flex-shrink-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl font-medium">
                            {selectedContact.name?.charAt(0)?.toUpperCase() ||
                              "C"}
                          </span>
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900 mb-1">
                            {selectedContact.name}
                          </h1>
                          <p className="text-lg text-blue-600 mb-1">
                            {selectedContact.title}
                          </p>
                          <p className="text-gray-600">
                            {selectedContact.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canEdit() ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-600 hover:text-gray-900"
                            onClick={() => handleEditContact(selectedContact)}
                          >
                            <Edit className="w-5 h-5" />
                          </Button>
                        ) : null}
                        {canDelete() ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-600 hover:text-red-600"
                            onClick={() => handleDeleteContact(selectedContact)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="bg-white rounded-lg border p-6 flex-1 min-h-0 flex flex-col">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex-shrink-0">
                        Contact Information
                      </h2>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <div className="grid grid-cols-2 gap-8">
                          {/* Left Column */}
                          <div className="space-y-6">
                            {/* Mobile Phone */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Mobile Phone
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-blue-600" />
                                <a
                                  href={`tel:${selectedContact.mobilePhone}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {selectedContact.mobilePhone}
                                </a>
                              </div>
                            </div>

                            {/* Work Phone */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Work Phone
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-blue-600" />
                                <a
                                  href={`tel:${selectedContact.workPhone}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {selectedContact.workPhone}
                                </a>
                              </div>
                            </div>

                            {/* Fax */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Fax
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-900">
                                  {selectedContact.fax}
                                </span>
                              </div>
                            </div>

                            {/* Email */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Email
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-blue-600" />
                                <a
                                  href={`mailto:${selectedContact.email}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {selectedContact.email}
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-6">
                            {/* Website */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Website
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <a
                                  href={selectedContact.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {selectedContact.website}
                                </a>
                              </div>
                            </div>

                            {/* Address */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Address
                              </h3>
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                                <span className="text-gray-900">
                                  {selectedContact.address}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          {/* Notes Section */}
                          {selectedContact.notes && (
                            <div className="col-span-2 mt-8 pt-6 border-t">
                              <h3 className="text-sm font-medium text-gray-700 mb-3">
                                Notes
                              </h3>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div
                                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: selectedContact.notes,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No contact selected
                      </h3>
                      <p className="text-gray-500">
                        Select a contact from the list to view details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Admin Panel */
              <div className="p-6 space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Panel
                </h1>

                {/* User Management Section */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <h2 className="text-xl font-semibold text-gray-900">
                          User Management
                        </h2>
                      </div>
                      <p className="text-gray-600">
                        Manage user accounts and permissions
                      </p>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setIsAddUserModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>

                  {/* User Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-500">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">
                            Password
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">
                            Role
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">
                            Created
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingUsers ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-8 text-center text-gray-500"
                            >
                              Loading users...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-8 text-center text-gray-500"
                            >
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr
                              key={user.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-gray-900">
                                {user.email}
                              </td>
                              <td className="py-3 px-4">
                                {editingUserId === user.id ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={editingUserPassword}
                                      onChange={(e) =>
                                        setEditingUserPassword(e.target.value)
                                      }
                                      className="h-8 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                      placeholder="Enter password"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-gray-900 font-mono">
                                    {user.password}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {editingUserId === user.id ? (
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={editingUserRole}
                                      onChange={(e) =>
                                        setEditingUserRole(e.target.value)
                                      }
                                      className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                      <option value="View">View</option>
                                      <option value="Edit">Edit</option>
                                      <option value="Admin">Admin</option>
                                    </select>
                                  </div>
                                ) : (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                    {user.role}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 text-sm rounded-full ${
                                    user.status === "Active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {user.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {user.createdAt.toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4">
                                {editingUserId === user.id ? (
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleSaveUser(
                                          user.id,
                                          editingUserRole,
                                          editingUserPassword
                                        )
                                      }
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      className="text-xs px-3 py-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleEditUser(
                                          user.id,
                                          user.role,
                                          user.password
                                        )
                                      }
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={
                                        user.status === "Active"
                                          ? "text-orange-600 hover:text-orange-700"
                                          : "text-green-600 hover:text-green-700"
                                      }
                                      onClick={() => toggleUserStatus(user)}
                                      title={
                                        user.status === "Active"
                                          ? "Deactivate User"
                                          : "Activate User"
                                      }
                                    >
                                      {user.status === "Active" ? (
                                        <UserX className="w-4 h-4" />
                                      ) : (
                                        <UserCheck className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteUser(user)}
                                      title="Delete User"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* IP Address Restrictions Section */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        IP Address Restrictions
                      </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Enable Restrictions
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ipSettings?.enabled || false}
                          onChange={async (e) => {
                            try {
                              await updateIPSettings({
                                enabled: e.target.checked,
                              });
                              success(
                                "IP Restrictions Updated",
                                `IP restrictions have been ${
                                  e.target.checked ? "enabled" : "disabled"
                                }`
                              );
                            } catch (error) {
                              console.error(
                                "Error updating IP restrictions:",
                                error
                              );
                              showError(
                                "Update Failed",
                                "Failed to update IP restriction settings. Please try again."
                              );
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allowed IP Ranges
                      </label>
                      <Textarea
                        value={ipRangesText}
                        onChange={(e) => {
                          setIpRangesText(e.target.value);
                        }}
                        onBlur={async (e) => {
                          try {
                            const cleanedRanges = e.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter((line) => line);
                            await updateIPSettings({
                              allowedRanges: cleanedRanges,
                            });
                          } catch (error) {
                            console.error("Error updating IP ranges:", error);
                            showError(
                              "Update Failed",
                              "Failed to update IP restrictions. Please try again."
                            );
                          }
                        }}
                        rows={6}
                        className="w-full font-mono text-sm"
                        placeholder="127.0.0.1&#10;192.168.1.0/24&#10;10.0.0.0/8"
                        disabled={!ipSettings?.enabled}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Enter IP addresses or CIDR ranges, one per line. Only
                        users from these IPs can access the application (Admin
                        users can access from anywhere).
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2 text-sm">
                        Important Notes:
                      </h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>
                          • Admin users can always access from any IP address
                        </li>
                        <li>
                          • Edit and View users will be restricted to the
                          specified IP ranges
                        </li>
                        <li>
                          • Use CIDR notation (e.g., 192.168.1.0/24) for IP
                          ranges
                        </li>
                        <li>
                          • Changes take effect immediately for new logins
                        </li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="font-medium text-amber-900 mb-1 text-sm">
                        ⚠️ Warning
                      </h3>
                      <p className="text-sm text-amber-800">
                        Be careful not to lock yourself out! Make sure your
                        current IP is included in the allowed ranges.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Data Management Section */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Data Management
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Import, export, and manage contact data in bulk
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Add Dummy Contacts */}
                    <div className="space-y-3 hidden">
                      <h3 className="text-lg font-medium text-gray-900">
                        Add Sample Data
                      </h3>
                      <p className="text-sm text-gray-500">
                        Add 3 dummy contacts for testing
                      </p>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={addDummyContacts}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Dummy Contacts
                      </Button>
                    </div>

                    {/* Import Contacts */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Import Contacts
                      </h3>
                      <p className="text-sm text-gray-500">
                        Upload CSV file with contact data
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleImportCSV}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isImporting}
                        />
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={isImporting}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isImporting ? "Importing..." : "Choose File"}
                        </Button>
                      </div>
                    </div>

                    {/* Export Contacts */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Export Contacts
                      </h3>
                      <p className="text-sm text-gray-500">
                        Download all contacts as CSV
                      </p>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={exportContactsToCSV}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>

                    {/* Delete All Contacts */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 text-red-600">
                        Delete All Contacts
                      </h3>
                      <p className="text-sm text-gray-500">
                        Permanently remove all contacts
                      </p>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleDeleteAllContacts}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal - Only for Edit and Admin users */}

      {canEdit() && (
        <AddContactModal
          open={isAddContactModalOpen}
          onOpenChange={setIsAddContactModalOpen}
          onSave={loadContacts}
        />
      )}

      {/* Edit Contact Modal - Only for Edit and Admin users */}
      {canEdit() && (
        <AddContactModal
          open={isEditContactModalOpen}
          onOpenChange={setIsEditContactModalOpen}
          editContact={editingContact}
          onSave={loadContacts}
        />
      )}

      {/* Delete Contact Modal - Only for Edit and Admin users */}
      {canDelete() && (
        <DeleteContactModal
          open={isDeleteContactModalOpen}
          onOpenChange={setIsDeleteContactModalOpen}
          contactName={deletingContact?.name || ""}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Add User Modal - Only for Admin users */}
      {canAdmin() && (
        <AddUserModal
          open={isAddUserModalOpen}
          onOpenChange={setIsAddUserModalOpen}
          onSave={loadUsers}
        />
      )}

      {/* Delete User Modal - Only for Admin users */}
      {canAdmin() && (
        <DeleteUserModal
          open={isDeleteUserModalOpen}
          onOpenChange={setIsDeleteUserModalOpen}
          userName={deletingUser?.email || ""}
          userEmail={deletingUser?.email || ""}
          onConfirm={confirmDeactivateUser}
        />
      )}

      {/* Delete All Contacts Modal - Only for Admin users */}
      {canAdmin() && (
        <DeleteAllContactsModal
          open={isDeleteAllContactsModalOpen}
          onOpenChange={setIsDeleteAllContactsModalOpen}
          contactCount={contacts.length}
          onConfirm={confirmDeleteAllContacts}
        />
      )}

      {/* Delete User Confirmation Modal - Only for Admin users */}
      {canAdmin() && (
        <DeleteUserConfirmModal
          open={isDeleteUserConfirmModalOpen}
          onOpenChange={setIsDeleteUserConfirmModalOpen}
          userName={userToDelete?.email || ""}
          userEmail={userToDelete?.email || ""}
          onConfirm={confirmDeleteUser}
        />
      )}
    </>
  );
}
