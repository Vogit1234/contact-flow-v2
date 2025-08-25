export default function RestrictedAccess() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <img 
        src="/accessdenied.png" 
        alt="Access Denied"
        className="max-w-md w-full h-auto mb-8"
      />
      <p className="text-xl font-bold text-gray-900">
        Unauthorized Access
      </p>
    </div>
  );
}