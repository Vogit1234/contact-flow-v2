export default function RestrictedAccess() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <img 
        src="/unauthorized.png" 
        alt="Unauthorized Access"
        className="max-w-2xl w-full h-auto mb-8"
      />
    </div>
  );
}