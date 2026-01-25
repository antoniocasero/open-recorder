import { Footer } from '@/components/Footer';

export default function InsightsPage() {
  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">
          Insights – Coming Soon
        </h1>
        <p className="text-slate-400">
          This page will provide analytics and metrics across all your
          recordings.
        </p>
      </div>
      <Footer>
        <div className="text-[10px] font-bold text-slate-500 uppercase">
          Metrics dashboard under development
        </div>
      </Footer>
    </>
  );
}