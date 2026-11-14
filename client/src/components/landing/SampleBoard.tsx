import React from 'react';
import { Bell, Check } from 'lucide-react';
import { useCountUp, useInView, useLanding, useTilt } from './hooks';
import { Reveal } from './ui';

const PROGRESS = 68;

const STATE_STYLE = {
  done: 'bg-brand text-white',
  doing: 'bg-neutral-100 text-neutral-800',
  late: 'bg-brand-soft text-brand',
} as const;

/** A fake sample board. All names are made up. */
export const SampleBoard: React.FC = () => {
  const { copy } = useLanding();
  const mock = copy.hero.mock;
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const percent = useCountUp(PROGRESS, inView);
  const tilt = useTilt<HTMLDivElement>(5);

  return (
    <div ref={ref} aria-hidden="true" className="relative mx-auto w-full max-w-md pb-12 lg:max-w-none lg:pb-10 lg:pl-6">
      <div ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave} className="lp-tilt">
        <Reveal delay={150}>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">W</span>
                <p className="text-sm font-bold">{mock.group}</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">{mock.sample}</span>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-neutral-600">{mock.progress}</span>
                <span className="text-base font-bold tabular-nums">{percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-brand transition-[width] duration-[1400ms] ease-out" style={{ width: inView ? `${PROGRESS}%` : '0%' }} />
              </div>
            </div>

            <ul className="mt-5 space-y-2.5">
              {mock.tasks.map((task, i) => (
                <li key={task.title}>
                  <Reveal delay={500 + i * 140}>
                    <div className="lp-lift flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          task.state === 'done' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {task.state === 'done' ? <Check className="size-4" /> : task.who.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-xs font-bold ${task.state === 'done' ? 'text-neutral-500 line-through' : ''}`}>{task.title}</p>
                        <p className="text-[11px] text-neutral-500">{task.who}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATE_STYLE[task.state]}`}>{task.status}</span>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <div className="absolute bottom-0 right-0 sm:right-4 lg:right-0">
        <Reveal kind="pop" delay={1100}>
          <div className="lp-float flex max-w-[17rem] items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xl">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <Bell className="size-4" />
            </span>
            <p className="text-xs font-semibold leading-relaxed">{mock.toast}</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
