import { Footer } from '@/components/Footer';

export default function LibraryPage() {
  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">
          Library page – content coming soon
        </h1>
        <p className="text-slate-400">
          This is where your recordings will be listed in a table with filters,
          waveforms, and status badges.
        </p>
      </div>
      <Footer>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Total Recordings: 124
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Total Duration: 42h 15m
          </span>
        </div>
      </Footer>
    </>
  );
}