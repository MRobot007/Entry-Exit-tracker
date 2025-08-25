import React, { useState, useEffect } from 'react';
import { Camera, LogIn, LogOut, Users, Activity, TrendingUp, Search, Filter, X, Building2, GraduationCap, Clock, Calendar, UserCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import QRCodeScanner from './QRCodeScanner';
import PersonManager from './PersonManager';
// import { syncManager } from '@/lib/syncManager';
// import type { OfflineEntry, OfflinePerson } from '@/lib/offlineStorage';

interface Entry {
  id: string;
  type: 'entry' | 'exit';
  personName: string;
  enrollmentNo: string;
  course: string;
  branch: string;
  semester: string;
  timestamp: Date;
  date: string;
  time: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

interface Person {
  id: string;
  name: string;
  enrollmentNo: string;
  email: string;
  phone: string;
  course: string;
  branch: string;
  semester: string;
  createdAt?: Date;
  qrCodeData?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

const EntryExitTracker = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Manual entry form state
  const [manualName, setManualName] = useState('');
  const [manualEnrollment, setManualEnrollment] = useState('');
  const [manualCourse, setManualCourse] = useState('');
  const [manualBranch, setManualBranch] = useState('');
  const [manualSemester, setManualSemester] = useState('');

  // Activity filters
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCourse, setActivityCourse] = useState('');
  const [activityBranch, setActivityBranch] = useState('');
  const [activitySemester, setActivitySemester] = useState('');
  const [activityType, setActivityType] = useState<'all' | 'entry' | 'exit'>('all');

  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Simplified data loading - just set empty arrays for now
      setEntries([]);
      setPeople([]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = async (personData: any) => {
    try {
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-GB');
      const currentTime = now.toLocaleTimeString('en-GB');

      const newEntry: Entry = {
        id: Date.now().toString(), // Temporary ID
        type: personData.type,
        personName: personData.name,
        enrollmentNo: personData.enrollmentNo,
        course: personData.course,
        branch: personData.branch,
        semester: personData.semester,
        timestamp: now,
        date: currentDate,
        time: currentTime,
        syncStatus: 'pending'
      };

      setEntries(prev => [newEntry, ...prev]);

      toast({
        title: `${personData.type === 'entry' ? 'Entry' : 'Exit'} Recorded`,
        description: `${personData.name} has been recorded`,
      });
    } catch (error) {
      console.error('Error recording entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to record entry/exit',
        variant: 'destructive',
      });
    }
  };

  const handleManualEntry = async (type: 'entry' | 'exit') => {
    if (!manualName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-GB');
      const currentTime = now.toLocaleTimeString('en-GB');

      const entryData = {
        date: currentDate,
        time: currentTime,
        type,
        personName: manualName.trim(),
        enrollmentNo: manualEnrollment.trim() || 'N/A',
        course: manualCourse.trim() || 'N/A',
        branch: manualBranch.trim() || 'N/A',
        semester: manualSemester.trim() || 'N/A'
      };

      // Temporary entry creation
      const entryId = Date.now().toString();

      const newEntry: Entry = {
        id: entryId,
        type,
        personName: manualName.trim(),
        enrollmentNo: manualEnrollment.trim() || 'N/A',
        course: manualCourse.trim() || 'N/A',
        branch: manualBranch.trim() || 'N/A',
        semester: manualSemester.trim() || 'N/A',
        timestamp: now,
        date: currentDate,
        time: currentTime,
        syncStatus: 'pending'
      };

      setEntries(prev => [newEntry, ...prev]);

      // Clear form
      setManualName('');
      setManualEnrollment('');
      setManualCourse('');
      setManualBranch('');
      setManualSemester('');

      toast({
        title: `${type === 'entry' ? 'Entry' : 'Exit'} Recorded`,
        description: `${manualName} has been recorded manually${!navigator.onLine ? ' (offline)' : ''}`,
      });
    } catch (error) {
      console.error('Error recording manual entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to record entry/exit',
        variant: 'destructive',
      });
    }
  };

  // Handle quick exit from recent activity
  const handleQuickExit = async (entry: Entry) => {
    // Confirm exit action
    const confirmed = window.confirm(
      `Are you sure you want to mark ${entry.personName} as exited?\n\nThis will record an exit entry with the same details.`
    );
    
    if (!confirmed) return;

    try {
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-GB');
      const currentTime = now.toLocaleTimeString('en-GB');

      const exitData = {
        date: currentDate,
        time: currentTime,
        type: 'exit' as const,
        personName: entry.personName,
        enrollmentNo: entry.enrollmentNo,
        course: entry.course,
        branch: entry.branch,
        semester: entry.semester
      };

      // Temporary exit creation
      const exitId = Date.now().toString();

      const newExit: Entry = {
        id: exitId,
        type: 'exit',
        personName: entry.personName,
        enrollmentNo: entry.enrollmentNo,
        course: entry.course,
        branch: entry.branch,
        semester: entry.semester,
        timestamp: now,
        date: currentDate,
        time: currentTime,
        syncStatus: 'pending'
      };

      setEntries(prev => [newExit, ...prev]);

      toast({
        title: 'Exit Recorded',
        description: `${entry.personName} has been marked as exited${!navigator.onLine ? ' (offline)' : ''}`,
      });
    } catch (error) {
      console.error('Error recording quick exit:', error);
      toast({
        title: 'Error',
        description: 'Failed to record exit',
        variant: 'destructive',
      });
    }
  };

  const handlePersonAdded = (person: Person) => {
    setPeople(prev => [person, ...prev]);
  };

  // Filter entries based on search and filters
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !activitySearch || 
      entry.personName.toLowerCase().includes(activitySearch.toLowerCase()) ||
      entry.enrollmentNo.toLowerCase().includes(activitySearch.toLowerCase());
    
    const matchesCourse = !activityCourse || entry.course === activityCourse;
    const matchesBranch = !activityBranch || entry.branch === activityBranch;
    const matchesSemester = !activitySemester || entry.semester === activitySemester;
    const matchesType = activityType === 'all' || entry.type === activityType;

    return matchesSearch && matchesCourse && matchesBranch && matchesSemester && matchesType;
  });

  // Get unique values for filter options
  const uniqueCourses = [...new Set(entries.map(e => e.course))].filter(Boolean);
  const uniqueBranches = [...new Set(entries.map(e => e.branch))].filter(Boolean);
  const uniqueSemesters = [...new Set(entries.map(e => e.semester))].filter(Boolean);

  const clearActivityFilters = () => {
    setActivitySearch('');
    setActivityCourse('');
    setActivityBranch('');
    setActivitySemester('');
    setActivityType('all');
  };

  // Calculate statistics
  const today = new Date().toLocaleDateString('en-GB');
  const todayEntries = entries.filter(e => e.date === today && e.type === 'entry').length;
  const todayExits = entries.filter(e => e.date === today && e.type === 'exit').length;
  const totalEntries = entries.filter(e => e.type === 'entry').length;
  const totalExits = entries.filter(e => e.type === 'exit').length;
  const totalPeople = people.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading Campus Entry System...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen college-corporate">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Campus Entry Management System</h1>
                  <p className="text-sm text-slate-600">Official College Entry/Exit Tracking Portal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1">
                <span className="text-sm font-medium text-green-700">Active Session</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                <span className="text-sm font-medium text-blue-700">Secure Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Today's Entries</p>
                  <p className="text-3xl font-bold">{todayEntries}</p>
                </div>
                <LogIn className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

                     <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Today's Exits</p>
                  <p className="text-3xl font-bold">{todayExits}</p>
                </div>
                <LogOut className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

                     <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Entries</p>
                  <p className="text-3xl font-bold">{totalEntries}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

                     <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Registered People</p>
                  <p className="text-3xl font-bold">{totalPeople}</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <Shield className="w-6 h-6 text-blue-600" />
              Campus Entry Management Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="scanner" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 m-6 rounded-lg">
                <TabsTrigger value="scanner" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                  <Camera className="w-4 h-4" />
                  QR Scanner
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                  <UserCheck className="w-4 h-4" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="people" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                  Student Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scanner" className="p-6">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">QR Code Scanner</h3>
                        <p className="text-slate-600 mb-6">Scan student QR codes for quick entry/exit recording</p>
                      </div>
                      <Button 
                        onClick={() => setIsScannerOpen(true)}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Open QR Scanner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual" className="p-6">
                                 <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                                                 <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                           <UserCheck className="w-8 h-8 text-blue-600" />
                         </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Manual Entry/Exit Recording</h3>
                        <p className="text-slate-600">Record entry or exit manually for visitors or students without QR codes</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="manualName" className="text-sm font-medium text-slate-700">Full Name *</Label>
                          <Input
                            id="manualName"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder="Enter full name"
                            className="mt-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <Label htmlFor="manualEnrollment" className="text-sm font-medium text-slate-700">Enrollment Number (Optional)</Label>
                          <Input
                            id="manualEnrollment"
                            value={manualEnrollment}
                            onChange={(e) => setManualEnrollment(e.target.value)}
                            placeholder="Enter enrollment number (optional)"
                            className="mt-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="manualCourse" className="text-sm font-medium text-slate-700">Course (Optional)</Label>
                            <select
                              id="manualCourse"
                              value={manualCourse}
                              onChange={(e) => setManualCourse(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 mt-1"
                            >
                              <option value="">Select Course (Optional)</option>
                              <option value="B.E">B.E</option>
                              <option value="DIPLOMA">DIPLOMA</option>
                              <option value="BSc">BSc</option>
                              <option value="MSc">MSc</option>
                              <option value="Visitor">Visitor</option>
                              <option value="Parent">Parent</option>
                              <option value="Teacher">Teacher</option>
                              <option value="Staff">Staff</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="manualBranch" className="text-sm font-medium text-slate-700">Branch (Optional)</Label>
                            <select
                              id="manualBranch"
                              value={manualBranch}
                              onChange={(e) => setManualBranch(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 mt-1"
                            >
                              <option value="">Select Branch (Optional)</option>
                              <option value="Computer Engineering">Computer Engineering</option>
                              <option value="Mechanical Engineering">Mechanical Engineering</option>
                              <option value="Electrical Engineering">Electrical Engineering</option>
                              <option value="Civil Engineering">Civil Engineering</option>
                              <option value="IT">IT</option>
                              <option value="Visitor">Visitor</option>
                              <option value="Parent">Parent</option>
                              <option value="Teacher">Teacher</option>
                              <option value="Staff">Staff</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="manualSemester" className="text-sm font-medium text-slate-700">Semester (Optional)</Label>
                            <select
                              id="manualSemester"
                              value={manualSemester}
                              onChange={(e) => setManualSemester(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 mt-1"
                            >
                              <option value="">Select Semester (Optional)</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="8">8</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                                                       <Button 
                               onClick={() => handleManualEntry('entry')}
                               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                             >
                            <LogIn className="w-4 h-4 mr-2" />
                            Record Entry
                          </Button>
                          <Button 
                            onClick={() => handleManualEntry('exit')}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 py-3 rounded-lg font-medium"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Record Exit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="people" className="p-6">
                <PersonManager onPersonAdded={handlePersonAdded} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="mt-8 shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Activity className="w-6 h-6 text-blue-600" />
                Campus Activity Log
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  Showing {Math.min(10, filteredEntries.length)} of {filteredEntries.length}
                </span>
              </div>
            </div>
            
            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or enrollment number..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <select
                value={activityCourse}
                onChange={(e) => setActivityCourse(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Courses</option>
                {uniqueCourses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={activityBranch}
                onChange={(e) => setActivityBranch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Branches</option>
                {uniqueBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <select
                  value={activitySemester}
                  onChange={(e) => setActivitySemester(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Semesters</option>
                  {uniqueSemesters.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as 'all' | 'entry' | 'exit')}
                  className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </div>
              {(activitySearch || activityCourse || activityBranch || activitySemester || activityType !== 'all') && (
                <div className="md:col-span-5">
                  <Button variant="ghost" size="sm" onClick={clearActivityFilters} className="flex items-center gap-2 text-slate-600 hover:text-slate-800">
                    <X className="w-4 h-4" />
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  {entries.length === 0 ? (
                    <>
                      <p className="text-lg font-medium text-slate-700 mb-2">No campus activity recorded yet</p>
                      <p className="text-sm">Start by scanning QR codes or manually recording entries/exits</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-slate-700 mb-2">No results match your filters</p>
                      <p className="text-sm">Try changing or clearing the filters above</p>
                    </>
                  )}
                </div>
              ) : (
                filteredEntries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                                              <div className={`p-3 rounded-full ${
                          entry.type === 'entry' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                        {entry.type === 'entry' ? (
                          <LogIn className="w-5 h-5" />
                        ) : (
                          <LogOut className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{entry.personName}</p>
                        <p className="text-sm text-slate-600">
                          {entry.enrollmentNo} • {entry.course} {entry.branch} Sem {entry.semester}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">
                          {entry.type === 'entry' ? 'Entry' : 'Exit'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{entry.date}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{entry.time}</span>
                        </div>
                      </div>
                      {/* Quick Exit Button - Only show for entry items */}
                      {entry.type === 'entry' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickExit(entry)}
                                                     className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-medium"
                        >
                          <LogOut className="w-3 h-3" />
                          Exit
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* QR Scanner Dialog */}
        <QRCodeScanner
          onScanSuccess={handleScanSuccess}
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
        />
      </div>
    </div>
  );
};

export default EntryExitTracker;
