import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { School, Users, Copy, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const AdminWizard = ({ onComplete, initialSchoolName = "My School" }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [schoolName, setSchoolName] = useState(initialSchoolName);
  const [className, setClassName] = useState('');
  const [createdClass, setCreatedClass] = useState(null);
  const [inviteCodes, setInviteCodes] = useState({ teacher: '', student: '' });
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCreateClass = async () => {
    if (!className.trim()) return;
    
    setLoading(true);
    try {
      // Mock class creation - replace with actual API call
      const mockClass = {
        id: 'class-123',
        name: className,
        teacher_invite: 'DEMO-TEACHER-A',
        student_invite: 'DEMO-STUDENT-A'
      };
      
      setCreatedClass(mockClass);
      setInviteCodes({
        teacher: mockClass.teacher_invite,
        student: mockClass.student_invite
      });
      setCurrentStep(3);
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <School className="h-6 w-6" />
            Welcome to Strive Admin
          </CardTitle>
          <CardDescription>
            Let's set up your school in just a few steps
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex justify-center space-x-4 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <ArrowRight className={`h-4 w-4 mx-2 ${
                    currentStep > step ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: School Setup */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Step 1: Name Your School</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  School Name
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g., Lincoln High School"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!schoolName.trim()}
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Create First Class */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Step 2: Create Your First Class</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Math 101, 9th Grade Science"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleCreateClass}
                  disabled={!className.trim() || loading}
                  className="flex items-center gap-2"
                >
                  {loading ? 'Creating...' : 'Create Class'} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Copy Invite Codes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Step 3: Share Invite Codes</h3>
              <p className="text-gray-400">
                Your class "{className}" has been created! Share these codes to invite teachers and students:
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Teacher Invite</h4>
                      <p className="text-sm text-gray-400">For other teachers to join</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="px-3 py-1 bg-gray-700 rounded text-blue-400 font-mono">
                        {inviteCodes.teacher}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(inviteCodes.teacher, 'teacher')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {copiedCode === 'teacher' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Student Invite</h4>
                      <p className="text-sm text-gray-400">For students to join this class</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="px-3 py-1 bg-gray-700 rounded text-green-400 font-mono">
                        {inviteCodes.student}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(inviteCodes.student, 'student')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {copiedCode === 'student' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-200 mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-blue-300">
                  Students can join by visiting your school's login page and clicking 
                  "Have an invite code? → Join class" then entering the student code.
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleFinish}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" /> Start Using Strive
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWizard;