import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useEditorHistory = (initialState = {}) => {
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const addToHistory = useCallback((currentState) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(JSON.parse(JSON.stringify(currentState))); // Deep copy

            if (newHistory.length > 50) {
                newHistory.shift();
                setHistoryIndex(prevIndex => prevIndex); // Index stays same relative to content
            } else {
                setHistoryIndex(newHistory.length - 1);
            }
            return newHistory;
        });
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const state = history[newIndex];
            setHistoryIndex(newIndex);
            toast.success('Annullato');
            return state;
        }
        return null;
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const state = history[newIndex];
            setHistoryIndex(newIndex);
            toast.success('Ripristinato');
            return state;
        }
        return null;
    }, [history, historyIndex]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return {
        history,
        historyIndex,
        addToHistory,
        undo,
        redo,
        canUndo,
        canRedo
    };
};
