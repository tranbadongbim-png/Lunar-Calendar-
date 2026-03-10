/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Calendar from './components/Calendar';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 sm:py-12 flex items-center justify-center font-sans relative overflow-hidden transition-colors duration-500">
      {/* Liquid background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-400/30 dark:bg-purple-600/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400/30 dark:bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-pink-400/20 dark:bg-pink-600/10 blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      
      <div className="relative z-10 w-full">
        <Calendar />
      </div>
    </div>
  );
}
