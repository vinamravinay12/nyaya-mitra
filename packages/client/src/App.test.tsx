import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';
import { buildAssessment, completeFacts, rentalPlaybook } from './test-utils/fixtures.js';
import { expectNoViolations } from './test-utils/axe.js';

const SCENARIO = 'My landlord is keeping my deposit after I moved out in July.';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Routes by path so a test can set up the whole conversation at once. */
const mockApi = (classify: unknown, assess: unknown = buildAssessment(), status = 200): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string) =>
      Promise.resolve(
        path === '/api/classify' ? jsonResponse(classify, status) : jsonResponse(assess, status),
      ),
    ),
  );
};

const matched = (facts: Record<string, unknown>) => ({
  kind: 'matched',
  playbook: rentalPlaybook,
  confidence: 0.9,
  facts,
  injectionFindings: [],
});

const describeScenario = async (): Promise<void> => {
  await userEvent.type(screen.getByLabelText('What happened?'), SCENARIO);
  await userEvent.click(screen.getByRole('button', { name: 'Find out where I stand' }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('goes straight to the assessment when every fact was extracted', async () => {
    mockApi(matched(completeFacts));
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByText('You can handle this yourself')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('security deposit');
  });

  it('asks only for the facts that are still missing', async () => {
    const { state: _state, ...rest } = completeFacts;
    mockApi(matched(rest));
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByLabelText('Which state was the property in?')).toBeInTheDocument();
    });
    // Once answered, nothing else is outstanding and the assessment runs itself.
    await userEvent.type(screen.getByLabelText('Which state was the property in?'), 'Karnataka');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(screen.getByText('You can handle this yourself')).toBeInTheDocument();
    });
  });

  it('lets the user back out of a wrong match with their text intact', async () => {
    // Only some facts extracted, so the app lands on the questionnaire.
    const { state: _state, ...rest } = completeFacts;
    mockApi(matched(rest));
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Not your situation?' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Not your situation?' }));

    // Back on the description, with what they wrote still there to reword.
    const box = screen.getByLabelText('What happened?');
    expect(box).toHaveValue(SCENARIO);
    expect(screen.queryByRole('button', { name: 'Not your situation?' })).not.toBeInTheDocument();
  });

  it('clears the box between questions instead of keeping the last answer', async () => {
    const { state: _state, vacateDate: _date, ...rest } = completeFacts;
    mockApi(matched(rest));
    render(<App />);
    await describeScenario();

    const first = await screen.findByLabelText('Which state was the property in?');
    await userEvent.type(first, 'Karnataka');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    // A reused component instance would still be holding "Karnataka" here.
    const second = await screen.findByLabelText('When did you hand over possession?');
    expect(second).toHaveValue('');
  });

  it('lets the user go back to the previous question', async () => {
    const { state: _state, vacateDate: _date, ...rest } = completeFacts;
    mockApi(matched(rest));
    render(<App />);
    await describeScenario();

    // Nothing to go back to before the first answer is given.
    await screen.findByLabelText('Which state was the property in?');
    expect(screen.queryByRole('button', { name: /Back to the previous question/ })).toBeNull();

    await userEvent.type(screen.getByLabelText('Which state was the property in?'), 'Karnataka');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByLabelText('When did you hand over possession?');

    await userEvent.click(screen.getByRole('button', { name: /Back to the previous question/ }));
    expect(await screen.findByLabelText('Which state was the property in?')).toHaveValue('');
  });

  it('lets the user change an earlier answer from the summary', async () => {
    const { state: _state, vacateDate: _date, ...rest } = completeFacts;
    mockApi(matched(rest));
    render(<App />);
    await describeScenario();

    await userEvent.type(
      await screen.findByLabelText('Which state was the property in?'),
      'Karnataka',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByLabelText('When did you hand over possession?');

    expect(screen.getByText('Karnataka')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Which state was the property in/ }));
    expect(await screen.findByLabelText('Which state was the property in?')).toBeInTheDocument();
  });

  it('stops and routes an out-of-scope situation to a professional', async () => {
    mockApi({ kind: 'out-of-scope', reason: 'This is a criminal matter.' });
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('This needs a professional');
    });
    expect(screen.getByText('This is a criminal matter.')).toBeInTheDocument();
  });

  it('explains a service failure without technical detail', async () => {
    mockApi({}, {}, 503);
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('We could not help here');
    });
    expect(screen.getByText(/busy right now/)).toBeInTheDocument();
  });

  it('recovers when the assessment itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) =>
        Promise.resolve(
          path === '/api/classify' ? jsonResponse(matched(completeFacts)) : jsonResponse({}, 503),
        ),
      ),
    );
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('We could not help here');
    });
    expect(screen.getByText(/busy right now/)).toBeInTheDocument();
  });

  it('falls back to a generic message for an unexpected failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        // A 200 whose body is not JSON: the parse throws something that is not an ApiError.
        Promise.resolve(new Response('<html>gateway</html>', { status: 200 })),
      ),
    );
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('lets the user start over', async () => {
    mockApi({ kind: 'out-of-scope', reason: 'Criminal matter.' });
    render(<App />);
    await describeScenario();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Start again' }));
    expect(screen.getByLabelText('What happened?')).toHaveValue('');
  });

  it('keeps the disclaimer visible at every step', async () => {
    mockApi(matched(completeFacts));
    render(<App />);
    expect(screen.getByText(/is not a lawyer/)).toBeInTheDocument();
    await describeScenario();
    await waitFor(() => {
      expect(screen.getByText('You can handle this yourself')).toBeInTheDocument();
    });
    expect(screen.getByText(/is not a lawyer/)).toBeInTheDocument();
  });

  it('has no accessibility violations on the opening screen', async () => {
    mockApi(matched(completeFacts));
    const { container } = render(<App />);
    await expectNoViolations(container);
  });

  it('has no accessibility violations on the assessment screen', async () => {
    mockApi(matched(completeFacts));
    const { container } = render(<App />);
    await describeScenario();
    await waitFor(() => {
      expect(screen.getByText('You can handle this yourself')).toBeInTheDocument();
    });
    await expectNoViolations(container);
  });
});
