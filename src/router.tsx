import { createBrowserRouter } from 'react-router'
import { SiteLayout } from './layouts/SiteLayout.tsx'
import { ErrorPage } from './pages/ErrorPage.tsx'
import { FunPage } from './pages/FunPage.tsx'
import { GamesPage } from './pages/GamesPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'

// Each game and the About page load their code only when opened.
export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'games', element: <GamesPage /> },
      {
        path: 'games/apostle-flashcards',
        lazy: () => import('./games/apostle-flashcards/route.tsx'),
      },
      {
        path: 'games/resistor-challenge',
        lazy: () => import('./games/resistor-challenge/route.tsx'),
      },
      {
        path: 'games/battleship',
        lazy: () => import('./games/battleship/route.tsx'),
      },
      {
        path: 'games/memory-game',
        lazy: () => import('./games/memory-game/route.tsx'),
      },
      {
        path: 'games/rock-paper-scissors',
        lazy: () => import('./games/rock-paper-scissors/route.tsx'),
      },
      {
        path: 'games/retro-dungeon-crawler',
        lazy: () => import('./games/retro-dungeon-crawler/route.tsx'),
      },
      {
        path: 'games/carmen-racing',
        lazy: () => import('./games/carmen-racing/route.tsx'),
      },
      {
        path: 'games/i-nephi',
        lazy: () => import('./games/i-nephi/route.tsx'),
      },
      { path: 'fun', element: <FunPage /> },
      { path: 'about', lazy: () => import('./pages/about/route.tsx') },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
