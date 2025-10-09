#!/usr/bin/env python3
"""
eラーニングシステム 画像表示問題 完全修正スクリプト

使用方法:
    python3 apply_complete_fix.py <元のindex.html>

出力:
    index_fixed_complete.html - 完全に修正されたファイル
"""

import sys
import re

def apply_fixes(html_content):
    """6つの関数すべてに修正を適用"""
    
    print("🔧 修正を適用中...")
    
    # 修正1: async login() 関数
    print("  1/6 login関数を修正...")
    login_pattern = r'(async login\(\) \{[\s\S]*?)(if \(AppData\.courses\.length > 0\) \{[\s\S]*?AppData\.currentCourse = AppData\.courses\[0\];[\s\S]*?\}[\s\S]*?)(if \(user\.role === \'admin\'\))'
    
    login_replacement = r'''\1// 🔧 修正: 進行状況を読み込んでからコースを設定
                    const progress = await Database.loadProgress(user.id);
                    if (progress) {
                        AppData.savedProgress = progress;
                        // 進行状況にコースIDがある場合、そのコースを優先的に設定
                        if (progress.courseId) {
                            const course = AppData.courses.find(c => c.id === progress.courseId);
                            if (course) {
                                AppData.currentCourse = course;
                                console.log('✅ 進行状況からコースを復元:', course.title, 
                                           '画像数:', course.slideImages?.length || 0);
                            }
                        }
                    }
                    
                    // コースが設定されていない場合、デフォルトで最初のコースを設定
                    if (!AppData.currentCourse && AppData.courses.length > 0) {
                        AppData.currentCourse = AppData.courses[0];
                        console.log('✅ デフォルトコースを設定:', AppData.currentCourse.title, 
                                   '画像数:', AppData.currentCourse.slideImages?.length || 0);
                    }
                    
                    \3'''
    
    html_content = re.sub(login_pattern, login_replacement, html_content, count=1)
    
    # 修正2: async switchToLearning() 関数  
    print("  2/6 switchToLearning関数を修正...")
    switch_pattern = r'(async switchToLearning\(\) \{[\s\S]*?)(if \(AppData\.courses\.length > 0 && !AppData\.currentCourse\) \{[\s\S]*?AppData\.currentCourse = AppData\.courses\[0\];[\s\S]*?\})'
    
    switch_replacement = r'''\1if (AppData.courses.length > 0 && !AppData.currentCourse) {
                    AppData.currentCourse = AppData.courses[0];
                    console.log('✅ 学習画面: コースを設定:', AppData.currentCourse.title,
                               '画像数:', AppData.currentCourse.slideImages?.length || 0);
                }'''
    
    html_content = re.sub(switch_pattern, switch_replacement, html_content, count=1)
    
    # 修正3: resumeLearning() 関数
    print("  3/6 resumeLearning関数を修正...")
    resume_pattern = r'(resumeLearning\(\) \{[\s\S]*?)(if \(AppData\.savedProgress\.courseId\) \{[\s\S]*?\})([\s\S]*?AppData\.savedProgress = null;)'
    
    resume_replacement = r'''\1// 🔧 修正: コース復元のログを追加
                    if (AppData.savedProgress.courseId) {
                        const course = AppData.courses.find(c => c.id === AppData.savedProgress.courseId);
                        if (course) {
                            AppData.currentCourse = course;
                            console.log('✅ 学習再開: コースを復元:', course.title,
                                       '画像数:', course.slideImages?.length || 0,
                                       '現在のスライド:', AppData.learningState.slideIndex + 1);
                        } else {
                            console.warn('⚠️ 警告: 進行状況のコースID', AppData.savedProgress.courseId, 
                                        'が見つかりません');
                            // フォールバック: デフォルトコースを使用
                            if (AppData.courses.length > 0) {
                                AppData.currentCourse = AppData.courses[0];
                                console.log('✅ デフォルトコースを使用:', AppData.currentCourse.title);
                            }
                        }
                    } else {
                        console.warn('⚠️ 警告: 進行状況にcourseIdがありません');
                        if (!AppData.currentCourse && AppData.courses.length > 0) {
                            AppData.currentCourse = AppData.courses[0];
                            console.log('✅ デフォルトコースを設定:', AppData.currentCourse.title);
                        }
                    }
                    
                    \3'''
    
    html_content = re.sub(resume_pattern, resume_replacement, html_content, count=1)
    
    # 修正4: renderTrainingScreen() 関数
    print("  4/6 renderTrainingScreen関数を修正...")
    render_pattern = r'(renderTrainingScreen\(state, totalSlides\) \{[\s\S]*?)(const courseImages = )'
    
    render_insert = r'''\1// 🔧 修正: デバッグ情報を追加
                const courseImages = '''
    
    html_content = re.sub(render_pattern, render_insert, html_content, count=1)
    
    # renderTrainingScreenにログ追加
    render_log_pattern = r'(const courseImages = AppData\.currentCourse.*?\n)'
    render_log_insert = r'''\1    
                console.log('🖼️ スライド表示:', {
                    slideIndex: state.slideIndex + 1,
                    totalSlides: totalSlides,
                    hasCourse: !!AppData.currentCourse,
                    courseTitle: AppData.currentCourse?.title || 'なし',
                    courseImageCount: courseImages.length,
                    willShowCourseImage: courseImages.length > state.slideIndex,
                    willShowDemoImage: slideImages.length > state.slideIndex
                });
                '''
    
    html_content = re.sub(render_log_pattern, render_log_insert, html_content, count=1)
    
    # 修正5: async startFromBeginning() 関数
    print("  5/6 startFromBeginning関数を修正...")
    start_from_pattern = r'(async startFromBeginning\(\) \{[\s\S]*?)(if \(!AppData\.currentCourse && AppData\.courses\.length > 0\) \{[\s\S]*?AppData\.currentCourse = AppData\.courses\[0\];[\s\S]*?\})'
    
    start_from_replacement = r'''\1// 🔧 修正: コース設定の確認とログ追加
                if (!AppData.currentCourse && AppData.courses.length > 0) {
                    AppData.currentCourse = AppData.courses[0];
                    console.log('✅ 最初から開始: コースを設定:', AppData.currentCourse.title,
                               '画像数:', AppData.currentCourse.slideImages?.length || 0);
                } else if (AppData.currentCourse) {
                    console.log('✅ 最初から開始: 既存コースを使用:', AppData.currentCourse.title,
                               '画像数:', AppData.currentCourse.slideImages?.length || 0);
                } else {
                    console.error('❌ エラー: 利用可能なコースがありません');
                    alert('エラー: 利用可能なコースがありません。管理者に連絡してください。');
                    return;
                }'''
    
    html_content = re.sub(start_from_pattern, start_from_replacement, html_content, count=1)
    
    # 修正6: async startTraining() 関数
    print("  6/6 startTraining関数を修正...")
    start_train_pattern = r'(async startTraining\(\) \{[\s\S]*?)(if \(!AppData\.currentCourse && AppData\.courses\.length > 0\) \{[\s\S]*?AppData\.currentCourse = AppData\.courses\[0\];[\s\S]*?\})'
    
    start_train_replacement = r'''\1// 🔧 修正: コース確認とログ追加
                if (!AppData.currentCourse && AppData.courses.length > 0) {
                    AppData.currentCourse = AppData.courses[0];
                    console.log('✅ 研修開始: コースを設定:', AppData.currentCourse.title,
                               '画像数:', AppData.currentCourse.slideImages?.length || 0);
                } else if (!AppData.currentCourse) {
                    console.error('❌ エラー: 利用可能なコースがありません');
                    alert('エラー: 利用可能なコースがありません。管理者に連絡してください。');
                    return;
                } else {
                    console.log('✅ 研修開始: 既存コースを使用:', AppData.currentCourse.title,
                               '画像数:', AppData.currentCourse.slideImages?.length || 0);
                }'''
    
    html_content = re.sub(start_train_pattern, start_train_replacement, html_content, count=1)
    
    # デバッグユーティリティを追加
    print("  ➕ debugCourseInfo関数を追加...")
    debug_function = '''
        // デバッグユーティリティ
        function debugCourseInfo() {
            console.log('=== コース情報 ===');
            console.log('現在のコース:', AppData.currentCourse?.title || '未設定');
            console.log('コースID:', AppData.currentCourse?.id || '未設定');
            console.log('総コース数:', AppData.courses.length);
            console.log('スライド画像数:', AppData.currentCourse?.slideImages?.length || 0);
            
            if (AppData.currentCourse?.slideImages?.length > 0) {
                console.log('画像1サンプル:', AppData.currentCourse.slideImages[0].data?.substring(0, 50) + '...');
            }
            
            console.log('現在のユーザー:', AppData.currentUser?.name || '未ログイン');
            console.log('学習状態:', AppData.learningState.screen);
            console.log('現在のスライド:', AppData.learningState.slideIndex + 1);
            
            return '✅ デバッグ情報をコンソールに出力しました';
        }

        // グローバルスコープに追加
        if (typeof window !== 'undefined') {
            window.debugCourseInfo = debugCourseInfo;
        }

        // アプリ起動
        document.addEventListener('DOMContentLoaded', () => {
            App.init();
        });
    </script>
</body>
</html>'''
    
    # 元の閉じタグを置換
    html_content = re.sub(
        r'(\s*// アプリ起動[\s\S]*?</body>\s*</html>)',
        debug_function,
        html_content,
        count=1
    )
    
    print("✅ すべての修正が完了しました！")
    return html_content


def main():
    if len(sys.argv) < 2:
        print("使用方法: python3 apply_complete_fix.py <元のindex.html>")
        print("\n例:")
        print("  python3 apply_complete_fix.py index.html")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = "index_fixed_complete.html"
    
    print(f"\n📖 ファイルを読み込み中: {input_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: ファイル読み込みに失敗: {e}")
        sys.exit(1)
    
    print(f"   元のファイルサイズ: {len(html_content):,} bytes")
    
    # 修正を適用
    fixed_content = apply_fixes(html_content)
    
    # 出力ファイルに保存
    print(f"\n💾 修正版を保存中: {output_file}")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
    except Exception as e:
        print(f"❌ エラー: ファイル保存に失敗: {e}")
        sys.exit(1)
    
    print(f"   修正版ファイルサイズ: {len(fixed_content):,} bytes")
    print(f"\n🎉 完了！ 修正版が作成されました: {output_file}")
    print("\n次のステップ:")
    print("  1. ブラウザで index_fixed_complete.html を開く")
    print("  2. F12でコンソールを開く")
    print("  3. 受講者でログイン（例: user1 / user1123）")
    print("  4. コンソールに '✅ 進行状況からコースを復元' と表示されることを確認")
    print("  5. スライドに '✅ 実際のスライド画像' と表示されることを確認")
    print("\nデバッグ:")
    print("  コンソールで debugCourseInfo() を実行すると詳細情報を表示")


if __name__ == "__main__":
    main()
