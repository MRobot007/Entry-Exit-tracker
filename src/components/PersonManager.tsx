import { useState, useEffect } from 'react';
import { UserPlus, QrCode, Camera, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { googleSheetsDB } from '@/lib/googleSheets';

export interface Person {
  id: string;
  name: string;
  enrollmentNo: string; // Now required
  email: string; // Now required
  phone: string; // Now required
  course: string; // New field
  branch: string; // New field
  semester: string; // New field
  createdAt?: Date;
  qrCodeData?: string; // Add QR code data
}

interface PersonManagerProps {
  onPersonAdded: (person: Person) => void;
}

const PersonManager = ({ onPersonAdded }: PersonManagerProps) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonEnrollment, setNewPersonEnrollment] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonCourse, setNewPersonCourse] = useState('');
  const [newPersonBranch, setNewPersonBranch] = useState('');
  const [newPersonSemester, setNewPersonSemester] = useState('');
  const [showQRCodes, setShowQRCodes] = useState<{[key: string]: boolean}>({});
  const [userId] = useState('default_user'); // Simple user ID for Google Sheets
  const { toast } = useToast();

  // Load people from Google Sheets
  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const sheetPeople = await googleSheetsDB.getPeople(userId);
      
      const peopleData = sheetPeople.map((person) => ({
        id: person.id,
        name: person.name,
        enrollmentNo: person.enrollmentNo,
        email: person.email || '', // Provide default empty string for required field
        phone: person.phone || '', // Provide default empty string for required field
        course: person.course,
        branch: person.branch,
        semester: person.semester,
        qrCodeData: person.qrCodeData, // Include QR code data
        createdAt: new Date(person.createdDate + ' ' + person.createdTime) // Combine date and time
      }));

      // Sort by created date descending
      peopleData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setPeople(peopleData);
    } catch (error) {
      console.error('Error loading people:', error);
      toast({
        title: 'Error',
        description: 'Failed to load people from Google Sheets',
        variant: 'destructive',
      });
    }
  };

  const generatePersonId = () => {
    return `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive"
      });
      return;
    }

    if (!newPersonEnrollment.trim()) {
      toast({
        title: "Error",
        description: "Please enter an enrollment number",
        variant: "destructive"
      });
      return;
    }

    if (!newPersonCourse.trim()) {
      toast({
        title: "Error",
        description: "Please select a course",
        variant: "destructive"
      });
      return;
    }

    if (!newPersonBranch.trim()) {
      toast({
        title: "Error",
        description: "Please select a branch",
        variant: "destructive"
      });
      return;
    }

    if (!newPersonSemester.trim()) {
      toast({
        title: "Error",
        description: "Please select a semester",
        variant: "destructive"
      });
      return;
    }

    if (!newPersonEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    if (!newPersonPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    try {
      const personId = generatePersonId();
      // Get current date and time in DD/MM/YYYY and HH:MM:SS format
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      const currentTime = now.toLocaleTimeString('en-GB'); // HH:MM:SS format

      // Generate QR code containing person data
      const personData = {
        id: personId,
        name: newPersonName.trim(),
        enrollmentNo: newPersonEnrollment.trim(),
        course: newPersonCourse.trim(),
        branch: newPersonBranch.trim(),
        semester: newPersonSemester.trim(),
        date: currentDate,
        time: currentTime
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(personData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });

      // Save to Google Sheets (without QR code data)
      await googleSheetsDB.addPerson({
        id: personId,
        name: newPersonName.trim(),
        enrollmentNo: newPersonEnrollment.trim(),
        email: newPersonEmail.trim(),
        phone: newPersonPhone.trim(),
        course: newPersonCourse.trim(),
        branch: newPersonBranch.trim(),
        semester: newPersonSemester.trim(),
        createdDate: currentDate,
        createdTime: currentTime
      });

      const newPerson: Person = {
        id: personId,
        name: newPersonName.trim(),
        enrollmentNo: newPersonEnrollment.trim(),
        email: newPersonEmail.trim(),
        phone: newPersonPhone.trim(),
        course: newPersonCourse.trim(),
        branch: newPersonBranch.trim(),
        semester: newPersonSemester.trim(),
        qrCodeData: qrCodeDataURL, // Add QR code data
        createdAt: new Date()
      };

      setPeople(prev => [...prev, newPerson]);
      onPersonAdded(newPerson);
      
      setNewPersonName('');
      setNewPersonEmail('');
      setNewPersonEnrollment('');
      setNewPersonPhone('');
      setNewPersonCourse('');
      setNewPersonBranch('');
      setNewPersonSemester('');
      setIsAddDialogOpen(false);

      toast({
        title: "Person Added",
        description: `${newPerson.name} has been registered successfully with QR code generated`,
      });
    } catch (error) {
      console.error('Error adding person:', error);
      toast({
        title: "Error",
        description: "Failed to add person to Google Sheets",
        variant: "destructive"
      });
    }
  };

  const deletePerson = async (personId: string) => {
    try {
      await googleSheetsDB.deletePerson(personId, userId);

      const person = people.find(p => p.id === personId);
      setPeople(prev => prev.filter(p => p.id !== personId));
      toast({
        title: "Person Removed",
        description: `${person?.name} has been removed`,
      });
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete person from Google Sheets',
        variant: 'destructive',
      });
    }
  };

  const downloadQRCode = (person: Person) => {
    if (person.qrCodeData) {
      const link = document.createElement('a');
      link.download = `${person.name.replace(/\s+/g, '_')}_qr_code.png`;
      link.href = person.qrCodeData;
      link.click();
    }
  };

  const toggleQRCodeVisibility = (personId: string) => {
    setShowQRCodes(prev => ({
      ...prev,
      [personId]: !prev[personId]
    }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Registered People</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Person</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter person's name"
                />
              </div>
              <div>
                <Label htmlFor="enrollment">Enrollment No *</Label>
                <Input
                  id="enrollment"
                  value={newPersonEnrollment}
                  onChange={(e) => setNewPersonEnrollment(e.target.value)}
                  placeholder="Enter enrollment number"
                />
              </div>
              <div>
                <Label htmlFor="course">Course *</Label>
                <select
                  id="course"
                  value={newPersonCourse}
                  onChange={(e) => setNewPersonCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select Course</option>
                  <option value="B.E">B.E</option>
                  <option value="DIPLOMA">DIPLOMA</option>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                </select>
              </div>
              <div>
                <Label htmlFor="branch">Branch *</Label>
                <select
                  id="branch"
                  value={newPersonBranch}
                  onChange={(e) => setNewPersonBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select Branch</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="IT">IT</option>
                </select>
              </div>
              <div>
                <Label htmlFor="semester">Semester *</Label>
                <select
                  id="semester"
                  value={newPersonSemester}
                  onChange={(e) => setNewPersonSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select Semester</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPersonEmail}
                  onChange={(e) => setNewPersonEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={newPersonPhone}
                  onChange={(e) => setNewPersonPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addPerson} className="flex-1">
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {people.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No people registered yet</p>
            <p className="text-sm">Add people to generate their QR codes</p>
          </div>
        ) : (
          people.map((person) => (
            <div key={person.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{person.name}</h3>
                  {person.enrollmentNo && (
                    <p className="text-sm text-muted-foreground">Enrollment: {person.enrollmentNo}</p>
                  )}
                  {person.course && (
                    <p className="text-sm text-muted-foreground">Course: {person.course}</p>
                  )}
                  {person.branch && (
                    <p className="text-sm text-muted-foreground">Branch: {person.branch}</p>
                  )}
                  {person.semester && (
                    <p className="text-sm text-muted-foreground">Semester: {person.semester}</p>
                  )}
                  {person.email && (
                    <p className="text-sm text-muted-foreground">Email: {person.email}</p>
                  )}
                  {person.phone && (
                    <p className="text-sm text-muted-foreground">Phone: {person.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Added: {person.createdAt?.toLocaleDateString()} at {person.createdAt?.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleQRCodeVisibility(person.id)}
                  >
                    {showQRCodes[person.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadQRCode(person)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePerson(person.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {showQRCodes[person.id] && person.qrCodeData && (
                <div className="flex justify-center pt-3 border-t">
                  <div className="text-center">
                    <img 
                      src={person.qrCodeData} 
                      alt={`QR Code for ${person.name}`}
                      className="mx-auto mb-2 border rounded-lg"
                      style={{ maxWidth: '200px' }}
                    />
                    <p className="text-sm text-muted-foreground">
                      QR Code for {person.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default PersonManager;