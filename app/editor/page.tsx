import { Footer } from '@/components/Footer';

export default function EditorPage() {
  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">
          Editor page – content coming soon
        </h1>
        <p className="text-slate-400">
          This is where you&apos;ll interact with a single recording&apos;s
          transcript, playback controls, and AI insights.
        </p>
      </div>
      <Footer>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Word count: 1,842
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Language: English
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Auto-scroll: On
          </span>
        </div>
      </Footer>
    </>
  );
}