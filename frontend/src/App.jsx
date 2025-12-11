import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import AuthLayout from './components/Layout/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import CategoryManagementPage from './pages/CategoryManagementPage'
import AddBookPage from './pages/AddBookPage'
import BookListPage from './pages/BookListPage'
import BookDetailPage from './pages/BookDetailPage'
import EditBookPage from './pages/EditBookPage'
import BorrowManagementPage from './pages/BorrowManagementPage'
import BorrowingHistoryPage from './pages/BorrowingHistoryPage'
import FineLevelManagementPage from './pages/FineLevelManagementPage'
import MyFinesPage from './pages/MyFinesPage'
import FineManagementPage from './pages/FineManagementPage'
import UserListPage from './pages/UserListPage'
import DashboardPage from './pages/DashboardPage'
import DetailedReportPage from './pages/DetailedReportPage'

function App() {
  return (
    <Routes>
      {/* Public pages with main layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="/books" element={<BookListPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route 
          path="/books/:id/edit" 
          element={
            <ProtectedRoute requiredRoles={['librarian', 'admin']}>
              <EditBookPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/categories" 
          element={
            <ProtectedRoute requiredRoles={['librarian', 'admin']}>
              <CategoryManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/books/add" 
          element={
            <ProtectedRoute requiredRoles={['librarian', 'admin']}>
              <AddBookPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/borrowings" 
          element={
            <ProtectedRoute requiredRoles={['librarian', 'admin']}>
              <BorrowManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/borrowings/history" 
          element={
            <ProtectedRoute requiredRole="reader">
              <BorrowingHistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fine-levels" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <FineLevelManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fines" 
          element={
            <ProtectedRoute requiredRole="reader">
              <MyFinesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fines/management" 
          element={
            <ProtectedRoute requiredRoles={['librarian', 'admin']}>
              <FineManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UserListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'librarian']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'librarian']}>
              <DetailedReportPage />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Auth pages with auth layout */}
      <Route element={<AuthLayout />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  )
}

export default App



