import React from 'react';
import TextField from '@mui/material/TextField';

interface SearchBarProps {
  OnDateChange: (date: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ OnDateChange }) => {
  return (
    <form className="search" noValidate>
      <TextField
        id="date"
        label=""
        type="date"
        defaultValue={new Date().toISOString().substring(0, 10)}
        className="date-picker"
        onChange={(e) => OnDateChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    </form>
  );
};

export default SearchBar;
