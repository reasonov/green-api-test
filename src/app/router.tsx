import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { RequireAuth } from '@/app/layout/RequireAuth'
import { AuthorFormPage } from '@/pages/AuthorFormPage'
import { AuthorPage } from '@/pages/AuthorPage'
import { AuthorsPage } from '@/pages/AuthorsPage'
import { BookFormPage } from '@/pages/BookFormPage'
import { BookPage } from '@/pages/BookPage'
import { BooksPage } from '@/pages/BooksPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ReportPage } from '@/pages/ReportPage'

const basename =
  import.meta.env.BASE_URL === '/'
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/books" replace /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'books', element: <BooksPage /> },
        {
          path: 'books/new',
          element: (
            <RequireAuth>
              <BookFormPage />
            </RequireAuth>
          ),
        },
        { path: 'books/:id', element: <BookPage /> },
        {
          path: 'books/:id/edit',
          element: (
            <RequireAuth>
              <BookFormPage />
            </RequireAuth>
          ),
        },
        { path: 'authors', element: <AuthorsPage /> },
        {
          path: 'authors/new',
          element: (
            <RequireAuth>
              <AuthorFormPage />
            </RequireAuth>
          ),
        },
        { path: 'authors/:id', element: <AuthorPage /> },
        {
          path: 'authors/:id/edit',
          element: (
            <RequireAuth>
              <AuthorFormPage />
            </RequireAuth>
          ),
        },
        { path: 'report', element: <ReportPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  basename ? { basename } : undefined,
)
