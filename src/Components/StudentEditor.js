import React, { useState } from 'react';
import PencilIcon from './PencilIcon';
import { GOES_TO_OPTIONS, goesToLabel, validateStudent } from '../students';

const EMPTY_DRAFT = { name: '', goesTo: '', yob: '' };
const NEW = 'new';

const inputStyle = { padding: '0.25rem 0.4rem', border: '1px solid #1976d2', borderRadius: '4px', fontSize: '0.9em' };
const iconButtonStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' };

// Inline add/edit/remove list for a listing's students. `onSave(nextStudents)` must return a
// promise that rejects with an Error (message shown inline) if the save fails. The whole array
// is saved each time; the parent decides where it goes (API for an existing listing, or form
// state for a new one).
function StudentEditor({ students, onSave }) {
    const [editing, setEditing] = useState(null); // index being edited, NEW, or null
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const list = Array.isArray(students) ? students : [];

    const startEdit = (index) => {
        const s = index === NEW ? EMPTY_DRAFT : list[index] || {};
        setDraft({ name: s.name || '', goesTo: s.goesTo || '', yob: s.yob ? String(s.yob) : '' });
        setError('');
        setEditing(index);
    };

    const cancelEdit = () => {
        setEditing(null);
        setDraft(EMPTY_DRAFT);
        setError('');
    };

    const save = (nextStudents) => {
        setSaving(true);
        return Promise.resolve(onSave(nextStudents))
            .then(() => {
                setEditing(null);
                setDraft(EMPTY_DRAFT);
                setError('');
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            })
            .catch(err => setError(err.message || 'Failed to save students'))
            .finally(() => setSaving(false));
    };

    const handleSubmit = () => {
        const validationError = validateStudent(draft);
        if (validationError) { setError(validationError); return; }

        const student = { name: draft.name.trim() };
        if (draft.goesTo) student.goesTo = draft.goesTo;
        if (draft.yob) student.yob = Number(draft.yob);

        const next = editing === NEW
            ? [...list, student]
            : list.map((s, i) => (i === editing ? student : s));
        save(next);
    };

    const handleRemove = (index) => {
        const s = list[index] || {};
        const label = (s.name && s.name.trim()) || `Student ${index + 1}`;
        if (!window.confirm(`Remove student "${label}"?`)) return;
        save(list.filter((_, i) => i !== index));
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
        if (e.key === 'Escape') cancelEdit();
    };

    const renderForm = () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', padding: '0.2rem 0' }}>
            <input
                autoFocus
                type="text"
                value={draft.name}
                placeholder="Student name"
                aria-label="Student name"
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                onKeyDown={onKeyDown}
                style={{ ...inputStyle, width: '14ch' }}
            />
            <select
                value={draft.goesTo}
                aria-label="Goes to"
                onChange={e => setDraft(d => ({ ...d, goesTo: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                style={inputStyle}
            >
                <option value="">— Goes to —</option>
                {GOES_TO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={draft.yob}
                placeholder="YOB"
                aria-label="Year of birth"
                onChange={e => { if (/^\d*$/.test(e.target.value)) setDraft(d => ({ ...d, yob: e.target.value })); }}
                onKeyDown={onKeyDown}
                style={{ ...inputStyle, width: '6ch' }}
            />
            <button onClick={handleSubmit} disabled={saving} title="Save student" style={{ ...iconButtonStyle, fontSize: '1.2rem', color: '#4caf50' }}>✔</button>
            <button onClick={cancelEdit} disabled={saving} title="Cancel" style={{ ...iconButtonStyle, fontSize: '1.1rem', color: '#999' }}>✕</button>
        </div>
    );

    return (
        <div style={{ fontSize: '0.9em', color: '#6a1b9a', padding: '0 0 0.4rem' }}>
            {list.map((student, index) => (
                editing === index ? (
                    <div key={index}>{renderForm()}</div>
                ) : (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <span>
                            🎓 {(student && student.name && student.name.trim()) || `Student ${index + 1}`}
                            {student && student.goesTo && <span style={{ color: '#555' }}> · {goesToLabel(student.goesTo)}</span>}
                            {student && student.yob && <span style={{ color: '#555' }}> · b. {student.yob}</span>}
                        </span>
                        {editing === null && (
                            <>
                                <button onClick={() => startEdit(index)} title="Edit student" aria-label="Edit student" style={{ ...iconButtonStyle, color: '#1976d2' }}><PencilIcon /></button>
                                <button onClick={() => handleRemove(index)} disabled={saving} title="Remove student" aria-label="Remove student" style={{ ...iconButtonStyle, color: '#c62828', fontSize: '0.95rem' }}>✕</button>
                            </>
                        )}
                    </div>
                )
            ))}
            {editing === NEW && renderForm()}
            {editing === null && (
                <button onClick={() => startEdit(NEW)} style={{ ...iconButtonStyle, color: '#1976d2', fontWeight: 600, fontSize: '0.9em', paddingLeft: 0 }}>
                    + Add student
                </button>
            )}
            {saved && <span style={{ color: '#4caf50', fontWeight: 600, fontSize: '0.9em', marginLeft: '0.5rem' }}>✔ Saved</span>}
            {error && <div role="alert" style={{ color: '#c62828', fontSize: '0.9em' }}>{error}</div>}
        </div>
    );
}

export default StudentEditor;
