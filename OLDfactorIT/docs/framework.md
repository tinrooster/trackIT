# TrackIT Framework Documentation

## Location and Cabinet System

### Location Structure
The location system uses a hierarchical structure that supports:
- Primary locations (e.g., "Engineering")
- Secondary locations (e.g., "LAB")
- Full path representation (e.g., "Engineering/LAB")

```typescript
interface ItemWithSubcategories {
  id: string;
  name: string;
  description?: string;
  children?: ItemWithSubcategories[];
}
```

### Cabinet Integration
Cabinets are tightly integrated with locations:
- Each cabinet is assigned to a specific location
- Cabinets are only available when their parent location is selected
- Cabinet availability is automatically managed in forms and batch operations

```typescript
interface Cabinet {
  id: string;
  name: string;
  locationId: string;  // Links to location name
  description?: string;
  qrCode?: string;
  isSecure: boolean;
  allowedCategories?: string[];
}
```

### State Management
The system uses React's built-in state management with hooks:
- `useInventory` hook provides access to locations and cabinets
- `useEffect` manages cabinet availability based on location selection
- Local storage for persistent data

### Batch Operations
The batch operation system supports:
1. Multi-item selection
2. Hierarchical location paths
3. Dynamic cabinet availability
4. Validation and error handling

### Logging System
Built-in logging for debugging:
- Stored in localStorage
- Downloadable for analysis
- Tracks operations and state changes

### Component Architecture

#### Location Selection
```typescript
// Location dropdown with path support
<Select value={location} onValueChange={handleLocationChange}>
  {flattenedLocationPaths.map((location: string) => (
    <SelectItem key={location} value={location}>
      {location}
    </SelectItem>
  ))}
</Select>
```

#### Cabinet Integration
```typescript
// Cabinet availability check
React.useEffect(() => {
  if (selectedLocation && cabinets) {
    const locationName = selectedLocation.split('/').pop() || '';
    const locationCabinets = cabinets.filter(
      cabinet => cabinet.locationId === locationName
    );
    setAvailableCabinets(locationCabinets);
  }
}, [selectedLocation, cabinets]);
```

### Best Practices

1. Location Management
   - Use consistent naming conventions
   - Maintain clear hierarchy
   - Document location structures

2. Cabinet Configuration
   - Unique IDs per cabinet
   - Clear, descriptive names
   - Proper location association

3. Batch Operations
   - Validate all updates
   - Maintain data consistency
   - Log all operations

4. Error Handling
   - Validate location paths
   - Check cabinet availability
   - Log errors with context

### Future Enhancements

1. Location Features
   - Location-specific settings
   - Custom attributes
   - Usage analytics

2. Cabinet Management
   - Capacity tracking
   - Access history
   - Maintenance logs

3. Batch Operations
   - Custom field updates
   - Bulk imports
   - Operation templates 