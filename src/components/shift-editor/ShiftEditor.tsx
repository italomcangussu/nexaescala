import React from 'react';
import { Group, Profile } from '../../types';
import ShiftEditorLayout from './ShiftEditorLayout';

interface ShiftEditorProps {
    group: Group;
    currentUser: Profile;
    onBack: () => void;
}

const ShiftEditor: React.FC<ShiftEditorProps> = ({ group, currentUser, onBack }) => {
    return (
        <ShiftEditorLayout
            group={group}
            currentUser={currentUser}
            onBack={onBack}
        />
    );
};

export default ShiftEditor;
