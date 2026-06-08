// frontend/src/utils/undoRedo.ts

export type Action<T> =
  | { type: 'EDIT_CELL';   payload: { prev: T[]; next: T[] } }
  | { type: 'ADD_ROW';     payload: { prev: T[]; next: T[] } }
  | { type: 'DELETE_ROWS'; payload: { prev: T[]; next: T[] } };

export interface UndoRedoState<T> {
  past:    Action<T>[];
  future:  Action<T>[];
}

export const initialUndoRedoState = <T>(): UndoRedoState<T> => ({
  past:   [],
  future: [],
});

export const pushAction = <T>(
  state: UndoRedoState<T>,
  action: Action<T>
): UndoRedoState<T> => ({
  past:   [...state.past, action],
  future: [],                      // clear redo stack on new action
});

export const undo = <T>(
  state: UndoRedoState<T>,
  currentRows: T[]
): { rows: T[]; next: UndoRedoState<T> } | null => {
  if (state.past.length === 0) return null;

  const last    = state.past[state.past.length - 1];
  const newPast = state.past.slice(0, -1);

  return {
    rows: last.payload.prev,
    next: {
      past:   newPast,
      future: [{ ...last, payload: { ...last.payload, prev: currentRows } }, ...state.future],
    },
  };
};

export const redo = <T>(
  state: UndoRedoState<T>,
  currentRows: T[]
): { rows: T[]; next: UndoRedoState<T> } | null => {
  if (state.future.length === 0) return null;

  const next       = state.future[0];
  const newFuture  = state.future.slice(1);

  return {
    rows: next.payload.next,
    next: {
      past:   [...state.past, { ...next, payload: { ...next.payload, prev: currentRows } }],
      future: newFuture,
    },
  };
};