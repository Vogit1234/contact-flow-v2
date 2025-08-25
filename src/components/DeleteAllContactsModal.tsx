import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DeleteAllContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactCount: number;
  onConfirm: () => void;
}

export default function DeleteAllContactsModal({ 
  open, 
  onOpenChange, 
  contactCount,
  onConfirm 
}: DeleteAllContactsModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Delete All Contacts
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Are you sure you want to delete <span className="font-medium text-red-600">all {contactCount} contacts</span>? 
          </p>
          <p className="text-sm text-red-600 font-medium leading-relaxed">
            ⚠️ This action cannot be undone and will permanently remove all contacts from the address book for all users.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="mr-2"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={deleting}
          >
            {deleting ? "Deleting All..." : "Delete All Contacts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}