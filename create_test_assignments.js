// Script to create test assignments
const supabaseUrl = 'https://mfmijckzlhevduwfigkl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E';

async function createTestAssignments() {
    try {
        // First get some checklist items
        const checklistResponse = await fetch(`${supabaseUrl}/rest/v1/task_checklist_items?select=id&limit=5`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        const checklistItems = await checklistResponse.json();
        console.log('Checklist items:', checklistItems);

        // Get some employees
        const employeesResponse = await fetch(`${supabaseUrl}/rest/v1/employees?select=id,first_name,last_name&limit=3`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        const employees = await employeesResponse.json();
        console.log('Employees:', employees);

        if (checklistItems.length === 0 || employees.length === 0) {
            console.log('No checklist items or employees found');
            return;
        }

        // Create assignments
        const assignments = [];
        const responsibilityTypes = ['accountable', 'responsible', 'consulted', 'informed'];

        checklistItems.forEach((item, index) => {
            const employee = employees[index % employees.length];
            assignments.push({
                checklist_item_id: item.id,
                employee_id: employee.id,
                responsibility_type: responsibilityTypes[index % responsibilityTypes.length]
            });
        });

        console.log('Creating assignments:', assignments);

        for (const assignment of assignments) {
            const response = await fetch(`${supabaseUrl}/rest/v1/task_checklist_item_assignments`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(assignment)
            });

            if (response.ok) {
                console.log('Created assignment:', assignment);
            } else {
                console.error('Failed to create assignment:', response.status, await response.text());
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

createTestAssignments();


