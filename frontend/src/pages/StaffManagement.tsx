// pages/StaffManagement.tsx - Complete Version
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { hasPermission, isAdmin } from '@/lib/permissions';

const NODE_BACKEND_URL =import.meta.env.VITE_BACKEND_URL ;

interface StaffUser {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  permissions: string[];
}

const StaffManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    is_active: true,
    permissions: [] as string[]
  });

  // Permission categories
  const permissionCategories = [
    {
      category: 'Dashboard',
      permissions: [
        { id: 'view_dashboard', label: 'View Dashboard', description: 'Can access dashboard' }
      ]
    },
    {
      category: 'Rooms',
      permissions: [
        { id: 'view_rooms', label: 'View Rooms', description: 'Can view room list' },
        { id: 'manage_rooms', label: 'Manage Rooms', description: 'Can add/edit/delete rooms' }
      ]
    },
    {
      category: 'Bookings',
      permissions: [
        { id: 'view_bookings', label: 'View Bookings', description: 'Can view booking list' },
        { id: 'create_booking', label: 'Create Booking', description: 'Can create new bookings' },
        { id: 'edit_booking', label: 'Edit Booking', description: 'Can edit existing bookings' },
        { id: 'cancel_booking', label: 'Cancel Booking', description: 'Can cancel bookings' }
      ]
    },
    {
      category: 'Customers',
      permissions: [
        { id: 'view_customers', label: 'View Customers', description: 'Can view customer list' },
        { id: 'manage_customers', label: 'Manage Customers', description: 'Can add/edit customers' }
      ]
    },
    {
    category: 'Income & Expenses',
    permissions: [
      { id: 'view_collections', label: 'View Collections', description: 'Can view collections/income' },
      { id: 'view_expenses', label: 'View Expenses', description: 'Can view expenses' },
      { id: 'view_salaries', label: 'View Salaries', description: 'Can view salaries' },
      { id: 'manage_housekeeping', label: 'Manage Housekeeping', description: 'Can manage housekeeping tasks' }
    ]
  },
    {
      category: 'Reports',
      permissions: [
        { id: 'view_reports', label: 'View Reports', description: 'Can view reports' },
        { id: 'view_financial', label: 'View Financial', description: 'Can view financial data' }
      ]
    },
    {
      category: 'Administration',
      permissions: [
        { id: 'manage_staff', label: 'Manage Staff', description: 'Can manage staff users' },
        { id: 'manage_hotel_settings', label: 'Manage Settings', description: 'Can change hotel settings' }
      ]
    }
  ];

  // Check if user has permission to manage staff
  const canManageStaff = hasPermission('manage_staff') || isAdmin();

  useEffect(() => {
    if (canManageStaff) {
      fetchUsers();
    }
  }, []);

  // const fetchUsers = async () => {
  //   try {
  //     setLoading(true);
  //     const token = localStorage.getItem('authToken');
  //     const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
  //     const response = await fetch(`${NODE_BACKEND_URL}/permissions/users`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     const data = await response.json();
      
  //     if (data.success) {
  //       setUsers(data.data);
  //     } else {
  //       toast({
  //         title: "Error",
  //         description: data.message || "Failed to fetch users",
  //         variant: "destructive"
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to fetch users",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Filter users based on search and role
 
 const fetchUsers = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const response = await fetch(`${NODE_BACKEND_URL}/permissions/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      // FIX: Transform the data to ensure is_active is properly set
      const transformedUsers = data.data.map((user: any) => {
        let isActive = false; // CHANGE THIS LINE - default to false for all users
        
        // If user is admin, always set to active
        if (user.role === 'admin') {
          isActive = true;
        } else {
          // Check different possible field names for status
          if (user.is_active !== undefined) {
            // If is_active exists, use it (convert 1/0 to boolean if needed)
            isActive = user.is_active === true || user.is_active === 1 || user.is_active === '1';
          } else if (user.status !== undefined) {
            // If status exists, check if it's 'active'
            isActive = user.status === 'active' || user.status === 'Active' || user.status === 'ACTIVE';
          }
          // If neither field exists, isActive remains false (default)
        }
        
        return {
          ...user,
          is_active: isActive  // Ensure is_active is a boolean
        };
      });
      
      console.log("Transformed users:", transformedUsers); // Debug log
      setUsers(transformedUsers);
    } else {
      toast({
        title: "Error",
        description: data.message || "Failed to fetch users",
        variant: "destructive"
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch users",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};
 
 
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('authToken');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      // First create the user
      const response = await fetch(`${NODE_BACKEND_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          hotel_id: currentUser.hotel_id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Then assign permissions
        if (formData.permissions.length > 0) {
          await updateUserPermissions(data.data.id, formData.permissions);
        }
        
        toast({
          title: "Success",
          description: "Staff user created successfully"
        });
        
        setOpenDialog(false);
        resetForm();
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create user",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const updateUserPermissions = async (userId: number, permissions: string[]) => {
    try {
      const token = localStorage.getItem('authToken');
      
      await fetch(`${NODE_BACKEND_URL}/permissions/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          permissions
        })
      });
    } catch (error) {
      console.error("Failed to update permissions:", error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${NODE_BACKEND_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully"
        });
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleEditUser = (user: StaffUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
      permissions: user.permissions
    });
    setOpenDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setCreating(true);
      const token = localStorage.getItem('authToken');
      
      // Update user details
      const response = await fetch(`${NODE_BACKEND_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.is_active
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update permissions
        await updateUserPermissions(editingUser.id, formData.permissions);
        
        toast({
          title: "Success",
          description: "User updated successfully"
        });
        
        setOpenDialog(false);
        resetForm();
        setEditingUser(null);
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      is_active: true,
      permissions: []
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const togglePermission = (permissionId: string) => {
    const currentPermissions = [...formData.permissions];
    
    if (currentPermissions.includes(permissionId)) {
      // Remove permission
      setFormData({
        ...formData,
        permissions: currentPermissions.filter(p => p !== permissionId)
      });
    } else {
      // Add permission
      setFormData({
        ...formData,
        permissions: [...currentPermissions, permissionId]
      });
    }
  };

  const handleCopyCredentials = (user: StaffUser) => {
    const credentials = `Username: ${user.username}\nPassword: [Set by admin]`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Copied",
      description: "User credentials copied to clipboard"
    });
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Username', 'Email', 'Role', 'Phone', 'Status', 'Permissions'],
      ...filteredUsers.map(user => [
        user.name,
        user.username,
        user.email,
        user.role,
        user.phone || '',
        user.is_active ? 'Active' : 'Inactive',
        user.permissions.join(', ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // If user doesn't have permission to manage staff
  if (!canManageStaff) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Access Denied
              </CardTitle>
              <CardDescription className="text-center">
                You don't have permission to manage staff users.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage staff users and their permissions
            </p>
          </div>
          
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button variant="outline" onClick={handleExportUsers} className="h-9 flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="h-9 flex-1 sm:flex-none">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="flex max-h-[92dvh] w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-3xl sm:rounded-lg sm:p-6 fixed inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit Staff User' : 'Create New Staff User'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser 
                      ? 'Update user details and permissions' 
                      : 'Create a new staff user account with specific permissions'}
                  </DialogDescription>
                </DialogHeader>


                
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="Enter username"
                        disabled={!!editingUser}
                        required
                      />
                    </div>
                    
                    {!editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="Enter password"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Minimum 8 characters with letters and numbers
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="Enter email"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({...formData, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                           <SelectItem value="reception">Reception</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="housekeeping">Housekeeping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {editingUser && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                          />
                          <span>Active User</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Inactive users cannot login to the system
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Right Column: Permissions */}
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-3 block font-medium">Permissions</Label>
                      <div className="space-y-4 max-h-[350px] overflow-y-auto p-3 border rounded-lg">
                        {permissionCategories.map((category) => (
                          <div key={category.category} className="space-y-3">
                            <h4 className="font-medium text-sm border-b pb-1">
                              {category.category}
                            </h4>
                            {category.permissions.map((permission) => (
                              <div key={permission.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent">
                                <Switch
                                  checked={formData.permissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                  id={`permission-${permission.id}`}
                                />
                                <div className="flex-1">
                                  <Label 
                                    htmlFor={`permission-${permission.id}`} 
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {permission.label}
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3 text-sm">
                        <span className="text-muted-foreground">
                          Selected: {formData.permissions.length} permissions
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({...formData, permissions: []})}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    
                    {editingUser && (
                      <div className="space-y-2">
                        <Label>User Notes</Label>
                        <Textarea
                          placeholder="Add notes about this user..."
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingUser ? handleUpdateUser : handleCreateUser}
                    disabled={creating || (!editingUser && (!formData.password || formData.password.length < 8))}
                  >
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingUser ? 'Update User' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="reception">Reception</SelectItem> 
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Users</CardTitle>
            <CardDescription>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No users found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedRole !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'No staff users have been created yet'}
                </p>
                <Button onClick={() => {
                  resetForm();
                  setOpenDialog(true);
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create First User
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              user.role === 'admin' ? 'bg-purple-100' :
                              user.role === 'manager' ? 'bg-blue-100' :
                              'bg-gray-100'
                            }`}>
                              <User className={`w-4 h-4 ${
                                user.role === 'admin' ? 'text-purple-600' :
                                user.role === 'manager' ? 'text-blue-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span className="text-sm">{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'admin' ? 'default' :
                            user.role === 'manager' ? 'secondary' : 'outline'
                          }>
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'destructive'} className="gap-1">
                            {user.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {user.permissions.slice(0, 2).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission.split('_')[0]}
                              </Badge>
                            ))}
                            {user.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.permissions.length - 2} more
                              </Badge>
                            )}
                            {user.permissions.length === 0 && (
                              <span className="text-xs text-muted-foreground">No permissions</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.last_login 
                              ? new Date(user.last_login).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCredentials(user)}
                              title="Copy credentials"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete user"
                              disabled={user.role === 'admin'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className="text-sm text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'staff').length}
              </div>
              <p className="text-sm text-muted-foreground">Staff Members</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default StaffManagement;