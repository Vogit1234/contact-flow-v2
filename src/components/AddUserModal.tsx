import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { useAuth } from "../contexts/AuthContext";
import { useToastContext } from "../contexts/ToastContext";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

interface UserFormData {
  email: string;
  role: string;
  password: string;
}

export default function AddUserModal({ open, onOpenChange, onSave }: AddUserModalProps) {
  const { currentUser } = useAuth();
  const { success, error: showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    role: "View",
    password: ""
  });

  const handleInputChange = (field: keyof UserFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      showError("Validation Error", "Email and password are required");
      return;
    }

    if (formData.password.length < 6) {
      showError("Validation Error", "Password must be at least 6 characters long");
      return;
    }


    setLoading(true);

    let secondaryApp = null;
    
    try {
      // First check if a user with this email already exists (including deleted ones)
      const existingUserQuery = query(
        collection(db, "users"),
        where("email", "==", formData.email.trim().toLowerCase())
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        const existingUser = existingUserSnapshot.docs[0];
        const existingUserData = existingUser.data();
        
        // If user exists and is deleted, reactivate them
        if (existingUserData.status === 'Deleted') {
          await updateDoc(doc(db, "users", existingUser.id), {
            status: "Active",
            role: formData.role,
            password: formData.password.trim(),
            updatedAt: new Date(),
            reactivatedAt: new Date(),
            reactivatedBy: currentUser?.uid || ""
          });
          
          success("User Reactivated", `User ${formData.email} has been reactivated successfully`);
          
          // Reset form
          setFormData({
            email: "",
            role: "View",
            password: ""
          });

          onSave?.();
          onOpenChange(false);
          return;
        } else {
          // User exists and is not deleted
          showError("User Exists", "A user with this email address already exists and is active.");
          return;
        }
      }
      
      // Create a secondary Firebase app instance to avoid logging out the current admin
      secondaryApp = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      }, "secondary");

      const secondaryAuth = getAuth(secondaryApp);

      // Create user with admin-specified password using secondary auth
      console.log("Creating user with email:", formData.email.trim());
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email.trim(), formData.password.trim());
      const newUser = userCredential.user;
      console.log("User created successfully:", newUser.uid);

      // Create user profile in Firestore (using main db instance)
      console.log("Creating user profile in Firestore...");
      await setDoc(doc(db, "users", newUser.uid), {
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: formData.role,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || ""
      });
      console.log("User profile created successfully");

      // Clean up secondary auth (but don't wait for it to avoid timing issues)
      secondaryAuth.signOut().catch(console.error);

      success("User Added", `User ${formData.email} has been added successfully`);
      
      // Reset form
      setFormData({
        email: "",
        role: "View",
        password: ""
      });

      onSave?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding user:", error);
      let errorMessage = "Failed to add user. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered in Firebase Auth. The user may have been previously deleted. Try using the same email again to reactivate the account.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak.";
      }
      
      showError("Add User Failed", errorMessage);
    } finally {
      // Clean up secondary app if it was created
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (cleanupError) {
          console.error("Error cleaning up secondary app:", cleanupError);
        }
      }
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setFormData({
      email: "",
      role: "View",
      password: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add New User</DialogTitle>
        </DialogHeader>
        
        <form autoComplete="off" data-lpignore="true">
        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-900">
              Email Address *
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              className="w-full"
              required
              autoComplete="off"
              data-lpignore="true"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-900">
              Password *
            </label>
            <Input
              id="password"
              type="text"
              value={formData.password}
              onChange={handleInputChange('password')}
              className="w-full"
              required
              placeholder="Enter password for the user"
              minLength={6}
              autoComplete="off"
              data-lpignore="true"
            />
            <p className="text-xs text-gray-500">
              Minimum 6 characters required
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-gray-900">
              Role *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleInputChange('role')}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="View">View</option>
              <option value="Edit">Edit</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="mr-2"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? "Adding User..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}