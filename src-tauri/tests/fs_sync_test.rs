use syncarts_lib::commands::fs_sync::{read_local_workspace, write_local_file, delete_local_file};
use tempfile::tempdir;

#[test]
fn test_fs_sync_flow() {
    let dir = tempdir().unwrap();
    let base_path = dir.path().to_string_lossy().to_string();

    // 1. Directory is initially empty or doesn't have json
    let files = read_local_workspace(base_path.clone()).unwrap();
    assert_eq!(files.len(), 0);

    // 2. Write a file (read_local_workspace only scans .syncarts/collections
    // and .syncarts/environments, so the fixture must live there)
    write_local_file(
        base_path.clone(),
        ".syncarts/collections/test_folder/my_file.json".to_string(),
        "{\"hello\":\"world\"}".to_string(),
    ).unwrap();

    // 3. Write a non-json file (should be ignored)
    write_local_file(
        base_path.clone(),
        ".syncarts/collections/test_folder/my_file.txt".to_string(),
        "hello world".to_string(),
    ).unwrap();

    // 4. Read workspace
    let files = read_local_workspace(base_path.clone()).unwrap();
    assert_eq!(files.len(), 1);
    assert!(files[0].relative_path.contains("my_file.json"));
    assert_eq!(files[0].content, "{\"hello\":\"world\"}");

    // 5. Delete file
    delete_local_file(base_path.clone(), ".syncarts/collections/test_folder/my_file.json".to_string()).unwrap();

    let files = read_local_workspace(base_path.clone()).unwrap();
    assert_eq!(files.len(), 0);

    // 6. Test invalid base_path
    let invalid_read = read_local_workspace("/path/to/some/invalid/dir/that/does/not/exist".to_string());
    assert!(invalid_read.is_err());
}
