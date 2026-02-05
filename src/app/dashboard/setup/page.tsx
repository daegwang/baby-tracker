import { AddBabyForm } from '@/components/baby/add-baby-form';

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome! 👶</h1>
        <p className="text-center text-muted-foreground mb-8">
          Let's get started by adding your baby
        </p>
        <AddBabyForm />
      </div>
    </div>
  );
}
