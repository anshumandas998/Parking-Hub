# UserPanel Register Dialog Validation Update Plan

## Information Gathered
- AddVehicleDialog.tsx has comprehensive validation rules for vehicle registration
- UserPanel.tsx register dialog is missing all these validation rules
- Need to apply same validation rules from AddVehicleDialog to UserPanel register dialog

## Plan
1. Update vehicle type selection to use buttons (like AddVehicleDialog) instead of Select dropdown
2. Add brand and model dropdowns with predefined vehicle brands/models
3. Add formatVehicleNumber function for auto-formatting
4. Add validateVehicleNumber function with error handling
5. Add vehicleNumberError state
6. Update vehicle number Input to use formatVehicleNumber on change
7. Add validation on blur
8. Update submit handler to validate before registering

## Changes to make in UserPanel.tsx:
1. Update vehicle type UI from Select to button group (like AddVehicleDialog)
2. Add brand and model state variables
3. Add formatVehicleNumber and validateVehicleNumber functions
4. Add vehicleNumberError state
5. Update vehicle number input with onChange formatting and onBlur validation
6. Update the Register Vehicle Dialog form to include brand dropdown
7. Update handleRegisterVehicle to use validation

## Dependent Files
- src/react-app/pages/UserPanel.tsx

## Followup Steps
- Test the registration flow to verify validation works correctly
- Verify auto-formatting works as user types
- Verify error messages display correctly

