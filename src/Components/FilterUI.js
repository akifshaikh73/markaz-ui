import React from 'react';
import { useState } from 'react';

const FilterUI = ({ handleFilter }) => {
    const [filter, setFilter] = useState({ active: true, students: true });

    const handleActiveChange = (event) => {
        setFilter({ ...filter, active: event.target.value === 'true' });
    };

    const handleStudentsChange = (event) => {
        setFilter({ ...filter, students: event.target.value === 'exist' });
    };

    const handleFilterClick = () => {
        handleFilter(filter);
    };

    return (
        <div>
            <label>
                Active:
                <select value={filter.active ? 'true' : 'false'} onChange={handleActiveChange}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>
                Students:
                <select value={filter.students ? 'exist' : 'do not exist'} onChange={handleStudentsChange}>
                    <option value="exist">Exist</option>
                    <option value="do not exist">Do not exist</option>
                </select>
            </label>
            <button onClick={handleFilterClick}>Filter</button>
        </div>
    );
};

export default FilterUI;