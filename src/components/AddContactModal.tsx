import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useToastContext } from "../contexts/ToastContext";
import type { Contact } from "../lib/types";

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContact?: Contact | null;
  onSave?: () => void;
}

interface ContactFormData {
  fullName: string;
  company: string;
  title: string;
  mobilePhone: string;
  workPhone: string;
  fax: string;
  email: string;
  websiteUrl: string;
  address: string;
  notes: string;
}

export default function AddContactModal({ open, onOpenChange, editContact, onSave }: AddContactModalProps) {
  const { currentUser } = useAuth();
  const { success, error: showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    company: "",
    title: "",
    mobilePhone: "",
    workPhone: "",
    fax: "",
    email: "",
    websiteUrl: "",
    address: "",
    notes: ""
  });

  const isEditMode = !!editContact;

  // Load contact data when in edit mode
  useEffect(() => {
    if (editContact && open) {
      console.log('Loading edit contact notes:', editContact.notes);
      setFormData({
        fullName: editContact.name || "",
        company: editContact.company || "",
        title: editContact.title || "",
        mobilePhone: editContact.mobilePhone || "",
        workPhone: editContact.workPhone || "",
        fax: editContact.fax || "",
        email: editContact.email || "",
        websiteUrl: editContact.website || "",
        address: editContact.address || "",
        notes: editContact.notes || ""
      });
    } else if (!editContact && open) {
      // Reset form for add mode
      console.log('Resetting form for add mode');
      setFormData({
        fullName: "",
        company: "",
        title: "",
        mobilePhone: "",
        workPhone: "",
        fax: "",
        email: "",
        websiteUrl: "",
        address: "",
        notes: ""
      });
    }
  }, [editContact, open]);

  const handleInputChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleRichTextChange = (field: keyof ContactFormData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      showError("Validation Error", "Full name is required");
      return;
    }

    if (!currentUser) {
      showError("Authentication Error", "You must be logged in to save contacts");
      return;
    }

    setLoading(true);

    try {
      // Debug logging for notes
      console.log('Form data notes:', formData.notes);
      console.log('Form data notes type:', typeof formData.notes);
      console.log('Form data notes length:', formData.notes?.length);
      
      const contactData = {
        name: formData.fullName.trim(),
        title: formData.title.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
        mobilePhone: formData.mobilePhone.trim(),
        workPhone: formData.workPhone.trim(),
        fax: formData.fax.trim(),
        website: formData.websiteUrl.trim(),
        address: formData.address.trim(),
        notes: formData.notes || '', // Ensure it's never null/undefined
        createdBy: currentUser.uid,
        updatedAt: new Date()
      };
      
      console.log('Contact data being saved:', contactData);

      if (isEditMode && editContact) {
        // Update existing contact
        await updateDoc(doc(db, "contacts", editContact.id), {
          ...contactData
        });
        success("Contact Updated", `${formData.fullName} has been updated successfully`);
      } else {
        // Add new contact
        await addDoc(collection(db, "contacts"), {
          ...contactData,
          createdAt: new Date()
        });
        success("Contact Added", `${formData.fullName} has been added successfully`);
      }

      // Call the callback to refresh the contacts list
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving contact:", error);
      showError("Save Failed", "Failed to save contact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Row 1: Full Name and Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-gray-900">
                Full Name *
              </label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium text-gray-900">
                Company
              </label>
              <Input
                id="company"
                value={formData.company}
                onChange={handleInputChange('company')}
                className="w-full"
              />
            </div>
          </div>

          {/* Row 2: Title and Mobile Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-900">
                Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleInputChange('title')}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mobilePhone" className="text-sm font-medium text-gray-900">
                Mobile Phone
              </label>
              <Input
                id="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleInputChange('mobilePhone')}
                className="w-full"
              />
            </div>
          </div>

          {/* Row 3: Work Phone and Fax */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="workPhone" className="text-sm font-medium text-gray-900">
                Work Phone
              </label>
              <Input
                id="workPhone"
                value={formData.workPhone}
                onChange={handleInputChange('workPhone')}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="fax" className="text-sm font-medium text-gray-900">
                Fax
              </label>
              <Input
                id="fax"
                value={formData.fax}
                onChange={handleInputChange('fax')}
                className="w-full"
              />
            </div>
          </div>

          {/* Row 4: Email and Website URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="websiteUrl" className="text-sm font-medium text-gray-900">
                Website URL
              </label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={handleInputChange('websiteUrl')}
                className="w-full"
              />
            </div>
          </div>

          {/* Row 5: Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-gray-900">
              Address
            </label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={handleInputChange('address')}
              className="w-full"
              rows={3}
            />
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-gray-900">
              Notes
            </label>
            <RichTextEditor
              key={`notes-editor-${isEditMode ? editContact?.id : 'new'}-${open}`}
              value={formData.notes}
              onChange={handleRichTextChange('notes')}
              placeholder="Add notes about this contact..."
              className="w-full"
              rows={4}
            />
          </div>
        </div>

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
            {loading ? 'Saving...' : (isEditMode ? 'Update Contact' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}