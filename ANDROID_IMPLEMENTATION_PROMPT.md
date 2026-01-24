# PROMPT: Cập nhật Android theo tính năng mới của Web

## Mục tiêu
Cập nhật ứng dụng Android để đồng bộ với các tính năng mới đã được triển khai trên Web, bao gồm:
1. Phân quyền theo "Accountable" assignments
2. Bỏ hiển thị Status của Checklist Item
3. Progress Bar tính từ Tasks
4. Checklist Menu (MoreVertical)
5. Checklist Assignments Management
6. Auto-filter theo người đăng nhập

---

## PHẦN 1: PHÂN QUYỀN THEO "ACCOUNTABLE" ASSIGNMENTS

### Yêu cầu:
Thay đổi logic phân quyền từ dựa trên role/assignee sang dựa trên `accountable` assignments trong checklist và checklist item.

### File cần sửa: `TaskDetailActivity.java`

### Bước 1: Thêm các hàm kiểm tra quyền mới

Thêm vào `TaskDetailActivity.java`:

```java
/**
 * Kiểm tra xem user hiện tại có quyền quản lý checklist không
 * Dựa trên accountable assignments thay vì role/assignee
 */
private boolean canManageChecklist(TaskChecklist checklist) {
    // Admin/Manager luôn có quyền
    if (isAdminOrManager()) {
        return true;
    }
    
    // Lấy employee_id của user hiện tại
    String currentEmployeeId = getCurrentEmployeeId();
    if (currentEmployeeId == null) {
        return false;
    }
    
    // Kiểm tra xem user có trong checklist.assignments với accountable role không
    if (checklist.getAssignments() != null && !checklist.getAssignments().isEmpty()) {
        for (TaskChecklistAssignment assignment : checklist.getAssignments()) {
            if ("accountable".equals(assignment.getResponsibilityType()) 
                && currentEmployeeId.equals(assignment.getEmployeeId())) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Kiểm tra xem user hiện tại có quyền quản lý checklist item không
 * Dựa trên accountable assignments thay vì role/assignee
 */
private boolean canManageChecklistItem(TaskChecklistItem item) {
    // Admin/Manager luôn có quyền
    if (isAdminOrManager()) {
        return true;
    }
    
    // Lấy employee_id của user hiện tại
    String currentEmployeeId = getCurrentEmployeeId();
    if (currentEmployeeId == null) {
        return false;
    }
    
    // Kiểm tra xem user có trong item.assignments với accountable role không
    if (item.getAssignments() != null && !item.getAssignments().isEmpty()) {
        for (TaskChecklistItemAssignment assignment : item.getAssignments()) {
            if ("accountable".equals(assignment.getResponsibilityType()) 
                && currentEmployeeId.equals(assignment.getEmployeeId())) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Lấy employee_id của user hiện tại
 */
private String getCurrentEmployeeId() {
    // Lấy từ AuthManager hoặc từ user profile
    // Cần implement logic này dựa trên cách lưu trữ employee_id trong app
    AuthManager authManager = new AuthManager(this);
    String userId = authManager.getUserId();
    
    // Fetch employee_id từ users table hoặc employees table
    // Có thể cache trong SharedPreferences hoặc fetch từ API
    // TODO: Implement logic lấy employee_id từ userId
    return null; // Placeholder
}

/**
 * Kiểm tra xem user có phải Admin hoặc Manager không
 */
private boolean isAdminOrManager() {
    AuthManager authManager = new AuthManager(this);
    String role = authManager.getUserRole();
    return "admin".equalsIgnoreCase(role) || "manager".equalsIgnoreCase(role);
}
```

### Bước 2: Cập nhật Model classes

Đảm bảo các model classes có field `assignments`:

**TaskChecklist.java:**
```java
private List<TaskChecklistAssignment> assignments;

public List<TaskChecklistAssignment> getAssignments() {
    return assignments;
}

public void setAssignments(List<TaskChecklistAssignment> assignments) {
    this.assignments = assignments;
}
```

**TaskChecklistItem.java:**
```java
private List<TaskChecklistItemAssignment> assignments;

public List<TaskChecklistItemAssignment> getAssignments() {
    return assignments;
}

public void setAssignments(List<TaskChecklistItemAssignment> assignments) {
    this.assignments = assignments;
}
```

### Bước 3: Cập nhật API calls để fetch assignments

Trong `TaskService.java`, đảm bảo API call fetch checklist bao gồm assignments:

```java
// Khi fetch task details, cần include assignments
// API: GET /api/tasks/{taskId}
// Response phải include checklist.assignments và item.assignments
```

### Bước 4: Thay thế `canManageChecklistItems()` bằng `canManageChecklist()` và `canManageChecklistItem()`

Tìm tất cả chỗ sử dụng `canManageChecklistItems()` và thay thế:
- Cho checklist: dùng `canManageChecklist(checklist)`
- Cho checklist item: dùng `canManageChecklistItem(item)`

**Ví dụ trong `bindSubtasks()`:**
```java
// Thay vì:
if (canManageChecklistItems()) {
    buttonsContainer.addView(btnAddItem);
    // ...
}

// Thành:
if (canManageChecklist(checklist)) {
    buttonsContainer.addView(btnAddItem);
    // ...
}
```

**Ví dụ cho checklist item:**
```java
// Thay vì:
if (canManageChecklistItems()) {
    layoutActions.setVisibility(View.VISIBLE);
    // ...
}

// Thành:
if (canManageChecklistItem(item)) {
    layoutActions.setVisibility(View.VISIBLE);
    // ...
}
```

---

## PHẦN 2: BỎ HIỂN THỊ STATUS CỦA CHECKLIST ITEM

### Yêu cầu:
Bỏ hoàn toàn việc hiển thị và quản lý status ở cấp độ checklist item.

### File cần sửa:
1. `TaskDetailActivity.java`
2. `item_subtask.xml` (layout file)
3. `TaskService.java` (API calls)

### Bước 1: Bỏ TextView status trong layout

**File: `res/layout/item_subtask.xml`**

Tìm và xóa:
```xml
<TextView
    android:id="@+id/text_subtask_status"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    ... />
```

### Bước 2: Bỏ logic set status trong TaskDetailActivity.java

**File: `TaskDetailActivity.java`**

Trong hàm `bindSubtasks()`, tìm dòng:
```java
TextView status = view.findViewById(R.id.text_subtask_status);
```

Xóa hoặc comment out:
- Dòng khai báo `TextView status`
- Tất cả logic set text cho status
- Tất cả logic liên quan đến status

### Bước 3: Thêm hiển thị Accountable Person

**File: `res/layout/item_subtask.xml`**

Thêm TextView để hiển thị accountable person (thay thế cho status):

```xml
<LinearLayout
    android:id="@+id/layout_accountable_person"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:padding="4dp"
    android:background="@drawable/bg_rounded_green"
    android:visibility="gone">
    
    <ImageView
        android:layout_width="12dp"
        android:layout_height="12dp"
        android:src="@drawable/ic_user"
        android:tint="@color/green_600" />
    
    <TextView
        android:id="@+id/text_accountable_person"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textSize="10sp"
        android:textColor="@color/green_700"
        android:text="Người chịu trách nhiệm: ..." />
</LinearLayout>
```

**File: `TaskDetailActivity.java`**

Trong hàm `bindSubtasks()`, sau khi xử lý item, thêm:

```java
// Hiển thị accountable person
LinearLayout layoutAccountable = view.findViewById(R.id.layout_accountable_person);
TextView textAccountable = view.findViewById(R.id.text_accountable_person);

if (item.getAssignments() != null && !item.getAssignments().isEmpty()) {
    // Tìm assignment với responsibility_type = "accountable"
    TaskChecklistItemAssignment accountableAssignment = null;
    for (TaskChecklistItemAssignment assignment : item.getAssignments()) {
        if ("accountable".equals(assignment.getResponsibilityType())) {
            accountableAssignment = assignment;
            break;
        }
    }
    
    if (accountableAssignment != null) {
        // Fetch employee name từ employee_id
        String employeeName = getEmployeeName(accountableAssignment.getEmployeeId());
        if (employeeName != null && !employeeName.isEmpty()) {
            layoutAccountable.setVisibility(View.VISIBLE);
            textAccountable.setText("Người chịu trách nhiệm: " + employeeName);
        } else {
            layoutAccountable.setVisibility(View.GONE);
        }
    } else {
        layoutAccountable.setVisibility(View.GONE);
    }
} else {
    layoutAccountable.setVisibility(View.GONE);
}
```

### Bước 4: Bỏ status parameter trong API calls

**File: `TaskService.java`**

Tìm các hàm tạo/edit checklist item và bỏ parameter `status`:

```java
// Thay vì:
public void createChecklistItem(String checklistId, String content, String status, ...)

// Thành:
public void createChecklistItem(String checklistId, String content, ...)
```

Tương tự cho hàm update.

---

## PHẦN 3: PROGRESS BAR TÍNH TỪ TASKS

### Yêu cầu:
Thay đổi progress bar từ giá trị manual (`project.progress`) sang tính tự động từ % tasks completed.

### File cần sửa:
1. `ProjectDetailActivity.java` hoặc Fragment tương ứng
2. `TaskService.java` (nếu cần thêm API call)

### Bước 1: Thêm hàm fetch tasks progress

**File: `ProjectDetailActivity.java` hoặc Fragment**

Thêm hàm:

```java
/**
 * Fetch tasks và tính progress dựa trên % tasks completed
 */
private void fetchTasksProgress(String projectId) {
    TaskService taskService = new TaskService(this);
    
    taskService.getTasksByProject(projectId, new TaskService.TaskCallback<List<Task>>() {
        @Override
        public void onSuccess(List<Task> tasks) {
            if (tasks == null || tasks.isEmpty()) {
                updateProgressBar(0);
                return;
            }
            
            int totalTasks = tasks.size();
            int completedTasks = 0;
            
            for (Task task : tasks) {
                if ("completed".equals(task.getStatus())) {
                    completedTasks++;
                }
            }
            
            int progress = (completedTasks * 100) / totalTasks;
            updateProgressBar(progress);
        }
        
        @Override
        public void onError(String error) {
            Log.e("ProjectDetail", "Failed to fetch tasks for progress: " + error);
            // Giữ nguyên progress hiện tại hoặc set về 0
            updateProgressBar(0);
        }
    });
}

/**
 * Cập nhật progress bar UI
 */
private void updateProgressBar(int progress) {
    if (progressBar != null) {
        progressBar.setProgress(progress);
    }
    if (textProgressPercentage != null) {
        textProgressPercentage.setText(progress + "%");
    }
}
```

### Bước 2: Thêm API call trong TaskService

**File: `TaskService.java`**

Thêm hàm:

```java
/**
 * Lấy tất cả tasks của một project
 */
public void getTasksByProject(String projectId, TaskCallback<List<Task>> callback) {
    String url = baseUrl + "/api/tasks?project_id=" + projectId;
    
    // Sử dụng HTTP client để fetch
    // Parse response thành List<Task>
    // Call callback.onSuccess(tasks) hoặc callback.onError(error)
}
```

### Bước 3: Gọi fetchTasksProgress khi load project

Trong `onCreate()` hoặc `onResume()` của ProjectDetailActivity:

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // ... existing code ...
    
    String projectId = getIntent().getStringExtra("project_id");
    if (projectId != null) {
        fetchTasksProgress(projectId);
    }
}
```

### Bước 4: Bỏ UI edit progress thủ công

Nếu có input field hoặc button để edit progress thủ công, hãy ẩn hoặc xóa chúng.

---

## PHẦN 4: CHECKLIST MENU (MOREVERTICAL)

### Yêu cầu:
Thêm menu dropdown (PopupMenu) cho checklist header với options: "Thêm item mới", "Xóa checklist".

### File cần sửa:
1. `TaskDetailActivity.java`
2. `view_subtasks_header.xml` (nếu cần)

### Bước 1: Thêm ImageButton MoreVertical vào checklist header

**File: `TaskDetailActivity.java`**

Trong hàm `bindSubtasks()`, sau khi tạo các button Add/Edit/Delete, thêm:

```java
// MoreVertical Menu Button
ImageButton btnMore = new ImageButton(this);
btnMore.setImageResource(R.drawable.ic_more_vertical); // Cần thêm icon này vào drawable
btnMore.setBackgroundResource(R.drawable.bg_circle_primary);
btnMore.setColorFilter(android.graphics.Color.WHITE);
btnMore.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
LinearLayout.LayoutParams moreParams = new LinearLayout.LayoutParams(56, 56);
moreParams.setMargins(0, 0, 8, 0);
btnMore.setLayoutParams(moreParams);
btnMore.setPadding(12, 12, 12, 12);

// Chỉ hiển thị nếu có quyền
if (canManageChecklist(checklist)) {
    buttonsContainer.addView(btnMore);
    
    // Set click listener để hiển thị PopupMenu
    btnMore.setOnClickListener(v -> showChecklistMenu(v, checklist));
}
```

### Bước 2: Tạo hàm showChecklistMenu

**File: `TaskDetailActivity.java`**

Thêm hàm:

```java
/**
 * Hiển thị PopupMenu cho checklist
 */
private void showChecklistMenu(View anchor, TaskChecklist checklist) {
    PopupMenu popupMenu = new PopupMenu(this, anchor);
    popupMenu.getMenuInflater().inflate(R.menu.menu_checklist_actions, popupMenu.getMenu());
    
    popupMenu.setOnMenuItemClickListener(item -> {
        int itemId = item.getItemId();
        
        if (itemId == R.id.action_add_item) {
            showCreateChecklistItemDialog(checklist.getId(), checklist.getTitle());
            return true;
        } else if (itemId == R.id.action_delete_checklist) {
            showDeleteChecklistConfirmation(checklist);
            return true;
        }
        
        return false;
    });
    
    popupMenu.show();
}
```

### Bước 3: Tạo menu resource file

**File: `res/menu/menu_checklist_actions.xml`**

Tạo file mới:

```xml
<?xml version="1.0" encoding="utf-8"?>
<menu xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:id="@+id/action_add_item"
        android:title="Thêm item mới"
        android:icon="@drawable/ic_add" />
    
    <item
        android:id="@+id/action_delete_checklist"
        android:title="Xóa checklist"
        android:icon="@drawable/ic_delete" />
</menu>
```

### Bước 4: Thêm icon MoreVertical

Thêm file `ic_more_vertical.xml` vào `res/drawable/` hoặc sử dụng Material Icons.

---

## PHẦN 5: CHECKLIST ASSIGNMENTS MANAGEMENT

### Yêu cầu:
Thêm dialog để quản lý assignments cho checklist (không chỉ item), với multi-select employees.

### File cần sửa:
1. `TaskDetailActivity.java`
2. Tạo `ChecklistAssignmentsDialog.java` (hoặc dùng AlertDialog)

### Bước 1: Thêm nút "Nhân viên" vào checklist header

**File: `TaskDetailActivity.java`**

Trong hàm `bindSubtasks()`, thêm button:

```java
// Nhân viên Button (chỉ hiển thị nếu có quyền accountable)
Button btnEmployees = new Button(this);
btnEmployees.setText("Nhân viên");
btnEmployees.setTextSize(10);
btnEmployees.setPadding(8, 4, 8, 4);
btnEmployees.setBackgroundResource(R.drawable.bg_rounded_blue);
btnEmployees.setTextColor(getResources().getColor(R.color.blue_700));

// Hiển thị số lượng assignments nếu có
if (checklist.getAssignments() != null && !checklist.getAssignments().isEmpty()) {
    btnEmployees.setText("Nhân viên (" + checklist.getAssignments().size() + ")");
}

// Chỉ hiển thị nếu có quyền
if (canManageChecklist(checklist)) {
    headerLayout.addView(btnEmployees);
    
    btnEmployees.setOnClickListener(v -> showChecklistAssignmentsDialog(checklist));
}
```

### Bước 2: Tạo Dialog quản lý assignments

**File: `TaskDetailActivity.java`**

Thêm hàm:

```java
/**
 * Hiển thị dialog để quản lý checklist assignments
 */
private void showChecklistAssignmentsDialog(TaskChecklist checklist) {
    // Fetch danh sách employees từ project team
    fetchProjectTeamMembers(projectId, employees -> {
        // Tạo dialog với RecyclerView multi-select
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Quản lý nhân viên chịu trách nhiệm");
        
        // Tạo RecyclerView với CheckBox cho mỗi employee
        RecyclerView recyclerView = new RecyclerView(this);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        
        // Adapter với checkboxes
        ChecklistAssignmentsAdapter adapter = new ChecklistAssignmentsAdapter(
            employees,
            checklist.getAssignments(),
            (selectedEmployees) -> {
                // Save assignments
                saveChecklistAssignments(checklist.getId(), selectedEmployees);
            }
        );
        
        recyclerView.setAdapter(adapter);
        
        builder.setView(recyclerView);
        builder.setPositiveButton("Lưu", (dialog, which) -> {
            // Adapter sẽ handle save qua callback
        });
        builder.setNegativeButton("Hủy", null);
        
        builder.show();
    });
}
```

### Bước 3: Tạo Adapter cho RecyclerView

**File: `ChecklistAssignmentsAdapter.java`** (tạo mới)

```java
public class ChecklistAssignmentsAdapter extends RecyclerView.Adapter<ChecklistAssignmentsAdapter.ViewHolder> {
    private List<Employee> employees;
    private List<TaskChecklistAssignment> currentAssignments;
    private Set<String> selectedEmployeeIds;
    private OnAssignmentsChangedListener listener;
    
    public interface OnAssignmentsChangedListener {
        void onAssignmentsChanged(List<String> selectedEmployeeIds);
    }
    
    // Implement RecyclerView.Adapter methods
    // Mỗi item có CheckBox
    // Khi check/uncheck, update selectedEmployeeIds
    // Khi click Save, call listener.onAssignmentsChanged()
}
```

### Bước 4: Thêm API calls để save assignments

**File: `TaskService.java`**

Thêm hàm:

```java
/**
 * Lưu checklist assignments
 */
public void saveChecklistAssignments(String checklistId, List<String> employeeIds, TaskCallback<Void> callback) {
    // DELETE tất cả assignments hiện tại
    // POST assignments mới cho mỗi employeeId với responsibility_type = "accountable"
}
```

---

## PHẦN 6: AUTO-FILTER THEO NGƯỜI ĐĂNG NHẬP

### Yêu cầu:
Tự động filter dự án theo employee_id của user đăng nhập khi vào trang Projects.

### File cần sửa:
1. `ProjectsActivity.java` hoặc Fragment tương ứng
2. `ProjectsAdapter.java` (nếu có)

### Bước 1: Lấy employee_id của user đăng nhập

**File: `ProjectsActivity.java`**

Trong `onCreate()`:

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // ... existing code ...
    
    // Lấy employee_id của user hiện tại
    String currentEmployeeId = getCurrentEmployeeId();
    
    // Auto-filter projects
    if (currentEmployeeId != null) {
        filterProjectsByEmployee(currentEmployeeId);
    }
}
```

### Bước 2: Thêm hàm filter

**File: `ProjectsActivity.java`**

```java
/**
 * Filter projects theo employee_id
 */
private void filterProjectsByEmployee(String employeeId) {
    // Filter projects list:
    // - Projects có manager_id = employeeId
    // - Projects có employee trong project_team với employee_id = employeeId
    
    List<Project> filteredProjects = new ArrayList<>();
    
    for (Project project : allProjects) {
        // Check manager
        if (employeeId.equals(project.getManagerId())) {
            filteredProjects.add(project);
            continue;
        }
        
        // Check project team
        if (project.getTeamMembers() != null) {
            for (ProjectTeamMember member : project.getTeamMembers()) {
                if (employeeId.equals(member.getEmployeeId())) {
                    filteredProjects.add(project);
                    break;
                }
            }
        }
    }
    
    // Update adapter với filteredProjects
    projectsAdapter.updateProjects(filteredProjects);
}
```

---

## TỔNG KẾT CHECKLIST

### Files cần tạo mới:
1. `ChecklistAssignmentsAdapter.java`
2. `res/menu/menu_checklist_actions.xml`
3. `res/drawable/ic_more_vertical.xml` (hoặc dùng Material Icons)

### Files cần sửa:
1. `TaskDetailActivity.java` - Nhiều thay đổi
2. `TaskService.java` - Thêm API calls
3. `ProjectDetailActivity.java` - Thêm fetchTasksProgress
4. `ProjectsActivity.java` - Thêm auto-filter
5. `res/layout/item_subtask.xml` - Bỏ status, thêm accountable person
6. Model classes - Thêm assignments fields

### API Endpoints cần sử dụng:
- `GET /api/tasks/checklists/{checklistId}/assignments`
- `POST /api/tasks/checklists/{checklistId}/assignments`
- `DELETE /api/tasks/checklists/{checklistId}/assignments/{assignmentId}`
- `GET /api/tasks?project_id={projectId}`

### Testing:
1. Test phân quyền với các user khác nhau (accountable vs non-accountable)
2. Test bỏ status display
3. Test progress bar tính từ tasks
4. Test checklist menu
5. Test assignments management
6. Test auto-filter

---

## LƯU Ý QUAN TRỌNG

1. **Backward Compatibility**: Đảm bảo app vẫn hoạt động với API cũ nếu assignments chưa có
2. **Error Handling**: Xử lý lỗi khi fetch assignments thất bại
3. **Loading States**: Hiển thị loading indicator khi fetch data
4. **Caching**: Cân nhắc cache employee_id và assignments để tránh fetch nhiều lần
5. **UI/UX**: Đảm bảo UI nhất quán với Web version

---

## THỨ TỰ THỰC HIỆN ĐỀ XUẤT

1. **Priority 1**: Phân quyền Accountable + Bỏ Status + Progress Bar
2. **Priority 2**: Checklist Menu + Assignments Management
3. **Priority 3**: Auto-filter

Bắt đầu với Priority 1, test kỹ, sau đó tiếp tục với Priority 2 và 3.
