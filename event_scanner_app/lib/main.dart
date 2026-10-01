import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';

// إعدادات سوبابيس المباشرة
const String supabaseUrl = 'https://klkihualayaxyhjxhqru.supabase.co';
const String supabaseAnonKey = 'sb_publishable_NghToWYIb9jj_sz5QKdI4w_IIY-TeGC';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: supabaseUrl,
    publishableKey: supabaseAnonKey,
  );

  runApp(const EventScannerApp());
}

class EventScannerApp extends StatelessWidget {
  const EventScannerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ماسح البوابة',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFFF59E0B),
          surface: Color(0xFF1E293B),
        ),
        textTheme: GoogleFonts.cairoTextTheme(ThemeData.dark().textTheme),
      ),
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child!,
        );
      },
      home: const AuthWrapper(),
    );
  }
}

// -----------------------------------------------------------------------------
// غلاف التحقق وتسجيل الدخول وتغيير كلمة المرور الإجباري
// -----------------------------------------------------------------------------
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  Map<String, dynamic>? _currentUser;

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null) {
      return LoginScreen(
        onLoginSuccess: (user) {
          setState(() {
            _currentUser = user;
          });
        },
      );
    }

    if (_currentUser!['must_change_password'] == true) {
      return ChangePasswordScreen(
        currentUser: _currentUser!,
        onPasswordChanged: (updatedUser) {
          setState(() {
            _currentUser = updatedUser;
          });
        },
      );
    }

    return EventsListScreen(
      currentUser: _currentUser!,
      onLogout: () {
        setState(() {
          _currentUser = null;
        });
      },
    );
  }
}

// -----------------------------------------------------------------------------
// شاشة تسجيل الدخول (عربي / إنجليزي)
// -----------------------------------------------------------------------------
class LoginScreen extends StatefulWidget {
  final Function(Map<String, dynamic>) onLoginSuccess;

  const LoginScreen({super.key, required this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final supabase = Supabase.instance.client;
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;
  int _failedAttempts = 0;
  int _lockoutStage = 0;
  int _lockoutSeconds = 0;
  Timer? _lockoutTimer;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _lockoutTimer?.cancel();
    super.dispose();
  }

  String _formatLockoutCountdown(int seconds) {
    if (seconds >= 86400) {
      final days = seconds ~/ 86400;
      final hours = (seconds % 86400) ~/ 3600;
      return '$days يوم و $hours ساعة';
    }
    if (seconds >= 3600) {
      final hours = seconds ~/ 3600;
      final mins = (seconds % 3600) ~/ 60;
      return '$hours ساعة و $mins دقيقة';
    }
    if (seconds >= 60) {
      final mins = seconds ~/ 60;
      final remSecs = seconds % 60;
      return remSecs > 0 ? '$mins دقيقة و $remSecs ثانية' : '$mins دقيقة';
    }
    return '$seconds ثانية';
  }

  void _startLockout(int seconds) {
    _lockoutTimer?.cancel();
    setState(() {
      _lockoutSeconds = seconds;
      _errorMessage = 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم قفل تسجيل الدخول مؤقتاً (${_formatLockoutCountdown(seconds)}) لحماية الحساب.';
      _isLoading = false;
    });

    _lockoutTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_lockoutSeconds <= 1) {
        timer.cancel();
        setState(() {
          _lockoutSeconds = 0;
          _errorMessage = null;
        });
      } else {
        setState(() {
          _lockoutSeconds--;
        });
      }
    });
  }

  void _handleWrongPassword() {
    _failedAttempts++;
    if (_failedAttempts >= 5) {
      _failedAttempts = 0;
      _lockoutStage++;
      if (_lockoutStage == 1) {
        _startLockout(60); // المرحلة 1: 60 ثانية
      } else if (_lockoutStage == 2) {
        _startLockout(300); // المرحلة 2: 5 دقائق
      } else {
        _startLockout(172800); // المرحلة 3: يومين كاملين (48 ساعة)
      }
    } else {
      final remaining = 5 - _failedAttempts;
      setState(() {
        _errorMessage = 'كلمة المرور غير صحيحة (متبقي $remaining ${remaining == 1 ? "محاولة" : "محاولات"} قبل القفل المؤقت)';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogin() async {
    if (_lockoutSeconds > 0) return;
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. تجربة استدعاء دالة RPC المباشرة login_app_user
      try {
        final rpcRes = await supabase.rpc('login_app_user', params: {
          'p_username': username,
          'p_password': password,
        });
        final data = Map<String, dynamic>.from(rpcRes);
        if (data['success'] == true && data['user'] != null) {
          final u = Map<String, dynamic>.from(data['user']);
          final role = u['role']?.toString();
          final compStatus = u['company_status']?.toString() ?? (u['companies'] != null ? u['companies']['status']?.toString() : null);
          if (role != 'SUPER_ADMIN' && (compStatus == 'SUSPENDED' || compStatus == 'INACTIVE')) {
            setState(() {
              _errorMessage = 'يرجى التواصل مع الإدارة';
              _isLoading = false;
            });
            return;
          }
          _failedAttempts = 0;
          widget.onLoginSuccess(u);
          return;
        } else if (data['error'] != null) {
          final errStr = data['error'].toString();
          if (errStr.contains('كلمة المرور')) {
            _handleWrongPassword();
          } else {
            setState(() {
              _errorMessage = errStr;
              _isLoading = false;
            });
          }
          return;
        }
      } catch (rpcErr) {
        debugPrint('RPC login failed, trying direct query fallback: $rpcErr');
      }

      // 2. الاستعلام المباشر Fallback
      final response = await supabase
          .from('app_users')
          .select('*, companies (name, logo_url, status)')
          .ilike('username', username)
          .maybeSingle();

      if (response == null) {
        setState(() {
          _errorMessage = 'اسم المستخدم غير موجود بالنظام';
          _isLoading = false;
        });
        return;
      }

      final role = response['role']?.toString();
      final compStatus = response['companies'] != null ? response['companies']['status']?.toString() : null;
      if (role != 'SUPER_ADMIN' && (compStatus == 'SUSPENDED' || compStatus == 'INACTIVE')) {
        setState(() {
          _errorMessage = 'يرجى التواصل مع الإدارة';
          _isLoading = false;
        });
        return;
      }

      final tempPass = response['temp_password']?.toString().trim();
      final passHash = response['password_hash']?.toString().trim();

      final bytes = utf8.encode(password);
      final computedHash = sha256.convert(bytes).toString();

      final isValid = (tempPass != null && tempPass == password) || (passHash == computedHash);

      if (!isValid) {
        _handleWrongPassword();
        return;
      }

      _failedAttempts = 0;
      final userMap = Map<String, dynamic>.from(response);
      if (response['companies'] != null) {
        userMap['company_name'] = response['companies']['name'];
        userMap['company_logo'] = response['companies']['logo_url'];
      }

      widget.onLoginSuccess(userMap);
    } catch (e) {
      setState(() {
        _errorMessage = 'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // شعار وأيقونة التطبيق
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                          blurRadius: 18,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.qr_code_scanner_rounded,
                      color: Color(0xFF0F172A),
                      size: 42,
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'بوابة فحص الفعاليات',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'تسجيل دخول الموظف المعتمد لمسح التذاكر',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white60,
                    ),
                  ),
                  const SizedBox(height: 28),

                  // رسالة الخطأ
                  if (_errorMessage != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7F1D1D).withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.6)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Color(0xFFFCA5A5), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // بطاقة النموذج
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFF334155), width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'اسم المستخدم (عربي أو إنجليزي)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white70),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _usernameController,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'مثال: saud_gate أو سعود',
                            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                            prefixIcon: const Icon(Icons.person_outline, color: Color(0xFFF59E0B), size: 20),
                            filled: true,
                            fillColor: const Color(0xFF0F172A),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: Color(0xFF334155)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: Color(0xFF334155)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: Color(0xFFF59E0B), width: 1.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),

                        const Text(
                          'كلمة المرور أو الرمز المؤقت',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white70),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'أدخل كلمة المرور الخاصة بك',
                            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                            prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFFF59E0B), size: 20),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                color: Colors.white54,
                                size: 20,
                              ),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                            filled: true,
                            fillColor: const Color(0xFF0F172A),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: Color(0xFF334155)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: Color(0xFF334155)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(color: Color(0xFFF59E0B), width: 1.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: (_isLoading || _lockoutSeconds > 0) ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _lockoutSeconds > 0 ? const Color(0xFF334155) : const Color(0xFFF59E0B),
                              foregroundColor: _lockoutSeconds > 0 ? const Color(0xFFFCA5A5) : const Color(0xFF0F172A),
                              elevation: 3,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Color(0xFF0F172A),
                                    ),
                                  )
                                : _lockoutSeconds > 0
                                    ? Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Icon(Icons.timer_outlined, size: 20, color: Color(0xFFFCA5A5)),
                                          const SizedBox(width: 8),
                                          Text(
                                            'محظور مؤقتاً (${_formatLockoutCountdown(_lockoutSeconds)})',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFFFCA5A5)),
                                          ),
                                        ],
                                      )
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.login_rounded, size: 20),
                                          SizedBox(width: 8),
                                          Text(
                                            'تسجيل الدخول',
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                          ),
                                        ],
                                      ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // قسم التواصل والاستفسار
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B).withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'للتواصل والاستفسار: ',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFFBBF24),
                          ),
                        ),
                        const Directionality(
                          textDirection: TextDirection.ltr,
                          child: Text(
                            '967780791584',
                            style: TextStyle(
                              fontSize: 14,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// شاشة إجبارية لتغيير كلمة المرور المؤقتة عند أول تسجيل دخول
// -----------------------------------------------------------------------------
class ChangePasswordScreen extends StatefulWidget {
  final Map<String, dynamic> currentUser;
  final Function(Map<String, dynamic>) onPasswordChanged;

  const ChangePasswordScreen({
    super.key,
    required this.currentUser,
    required this.onPasswordChanged,
  });

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final supabase = Supabase.instance.client;
  final TextEditingController _newPassController = TextEditingController();
  final TextEditingController _confirmPassController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _newPassController.dispose();
    _confirmPassController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final newPass = _newPassController.text.trim();
    final confirmPass = _confirmPassController.text.trim();

    if (newPass.length < 4) {
      setState(() => _errorMessage = 'يجب ألا تقل كلمة المرور عن 4 خانات');
      return;
    }

    if (newPass != confirmPass) {
      setState(() => _errorMessage = 'كلمتا المرور غير متطابقتين، يرجى التأكد');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final userId = widget.currentUser['id'];

      // 1. استدعاء RPC
      try {
        final rpcRes = await supabase.rpc('change_app_user_password', params: {
          'p_user_id': userId,
          'p_new_password': newPass,
        });
        final data = Map<String, dynamic>.from(rpcRes);
        if (data['success'] == true) {
          final updated = Map<String, dynamic>.from(widget.currentUser);
          updated['must_change_password'] = false;
          updated['temp_password'] = null;
          widget.onPasswordChanged(updated);
          return;
        }
      } catch (rpcErr) {
        debugPrint('RPC change_app_user_password fallback: $rpcErr');
      }

      // 2. تحديث مباشر Fallback
      final bytes = utf8.encode(newPass);
      final newHash = sha256.convert(bytes).toString();

      await supabase.from('app_users').update({
        'password_hash': newHash,
        'temp_password': null,
        'must_change_password': false,
      }).eq('id', userId);

      final updated = Map<String, dynamic>.from(widget.currentUser);
      updated['must_change_password'] = false;
      updated['temp_password'] = null;
      widget.onPasswordChanged(updated);
    } catch (e) {
      setState(() {
        _errorMessage = 'تعذر تغيير كلمة المرور. تأكد من اتصالك بالإنترنت.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final fullName = widget.currentUser['full_name'] ?? 'الموظف';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFF59E0B), width: 2),
                    ),
                    child: const Icon(
                      Icons.shield_outlined,
                      color: Color(0xFFF59E0B),
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'تأمين الحساب (أول تسجيل دخول)',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'أهلاً بك يا $fullName.\nلحماية حسابك وبيانات شركتك، يرجى تعيين كلمة مرور سرية خاصة بك الآن. سيتم حذف الرقم المؤقت نهائياً.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.white70,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  if (_errorMessage != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7F1D1D).withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFEF4444)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Color(0xFFFCA5A5), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],

                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFF334155), width: 1.2),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'كلمة المرور السرية الجديدة',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white70),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _newPassController,
                          obscureText: true,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'على الأقل 4 خانات',
                            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                            prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF10B981), size: 20),
                            filled: true,
                            fillColor: const Color(0xFF0F172A),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                        const SizedBox(height: 18),

                        const Text(
                          'تأكيد كلمة المرور الجديدة',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white70),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _confirmPassController,
                          obscureText: true,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'أعد كتابة كلمة المرور للتطابق',
                            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                            prefixIcon: const Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 20),
                            filled: true,
                            fillColor: const Color(0xFF0F172A),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                        const SizedBox(height: 24),

                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleSubmit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                                  )
                                : const Text(
                                    'حفظ كلمة المرور والدخول',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// الشاشة الأولى: اختيار المناسبة (مفلترة بالشركة الخاصة بالموظف)
// -----------------------------------------------------------------------------
class EventsListScreen extends StatefulWidget {
  final Map<String, dynamic> currentUser;
  final VoidCallback onLogout;

  const EventsListScreen({
    super.key,
    required this.currentUser,
    required this.onLogout,
  });

  @override
  State<EventsListScreen> createState() => _EventsListScreenState();
}

class _EventsListScreenState extends State<EventsListScreen> {
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      var query = supabase.from('events').select('*');

      // عزل متعدد الشركات: إذا لم يكن أدمن عام، يعرض فقط مناسبات شركته
      final companyId = widget.currentUser['company_id'];
      if (widget.currentUser['role'] != 'SUPER_ADMIN' && companyId != null) {
        query = query.eq('company_id', companyId);
      }

      final response = await query.order('id', ascending: false);

      setState(() {
        _events = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'تعذر الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final companyName = widget.currentUser['company_name'] ?? 'بوابة الفعاليات';
    final employeeName = widget.currentUser['full_name'] ?? 'الموظف المعتمد';

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        centerTitle: true,
        title: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              companyName,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              'الموظف: $employeeName',
              style: const TextStyle(fontSize: 11, color: Color(0xFFFBBF24)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchEvents,
            tooltip: 'تحديث',
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444)),
            onPressed: widget.onLogout,
            tooltip: 'تسجيل الخروج',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF10B981)),
            )
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off, size: 64, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 16, color: Colors.white70),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: _fetchEvents,
                          icon: const Icon(Icons.refresh),
                          label: const Text('إعادة المحاولة'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _events.isEmpty
                  ? const Center(
                      child: Text(
                        'لا توجد مناسبات حالياً تابعة لشركتك بالسحابة',
                        style: TextStyle(fontSize: 16, color: Colors.white60),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchEvents,
                      color: const Color(0xFF10B981),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _events.length,
                        itemBuilder: (context, index) {
                          final event = _events[index];
                          final eventName = event['name'] ?? 'مناسبة بدون عنوان';
                          final date = event['date'] ?? '';
                          final venue = event['venue'] ?? '';
                          final time = event['time'] ?? '';

                          return Container(
                            margin: const EdgeInsets.only(bottom: 14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFF334155),
                                width: 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(16),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ScannerScreen(
                                        event: event,
                                        currentUser: widget.currentUser,
                                      ),
                                    ),
                                  );
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(18),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(
                                          Icons.qr_code_scanner,
                                          color: Color(0xFF10B981),
                                          size: 32,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              eventName,
                                              style: const TextStyle(
                                                fontSize: 17,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Row(
                                              children: [
                                                if (date.isNotEmpty) ...[
                                                  const Icon(Icons.calendar_today, size: 14, color: Colors.white60),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    date,
                                                    style: const TextStyle(fontSize: 13, color: Colors.white60),
                                                  ),
                                                  const SizedBox(width: 12),
                                                ],
                                                if (time.isNotEmpty) ...[
                                                  const Icon(Icons.access_time, size: 14, color: Colors.white60),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    time,
                                                    style: const TextStyle(fontSize: 13, color: Colors.white60),
                                                  ),
                                                ],
                                              ],
                                            ),
                                            if (venue.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  const Icon(Icons.location_on, size: 14, color: Colors.white60),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    venue,
                                                    style: const TextStyle(fontSize: 13, color: Colors.white60),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                      const Icon(
                                        Icons.arrow_back_ios_new,
                                        size: 16,
                                        color: Colors.white38,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}

// -----------------------------------------------------------------------------
// الشاشة الثانية: شاشة المسح الذكية (كاميرا + ليزر حي + حالة فورية + عدادات)
// -----------------------------------------------------------------------------
class ScannerScreen extends StatefulWidget {
  final Map<String, dynamic> event;
  final Map<String, dynamic>? currentUser;

  const ScannerScreen({super.key, required this.event, this.currentUser});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

enum ScanStatus { idle, success, failed, processing }

class _ScannerScreenState extends State<ScannerScreen> with SingleTickerProviderStateMixin {
  final MobileScannerController _cameraController = MobileScannerController(
    formats: const [BarcodeFormat.qrCode],
    detectionSpeed: DetectionSpeed.unrestricted,
    facing: CameraFacing.back,
    torchEnabled: false,
    returnImage: false,
  );

  final supabase = Supabase.instance.client;

  late AnimationController _laserController;
  Timer? _resetTimer;

  ScanStatus _status = ScanStatus.idle;
  String _statusTitle = 'جاهز للمسح وبانتظار رمز جديد';
  String _statusSub = 'وجّه الكاميرا نحو رمز QR على بطاقة الضيف';
  String? _previousUsedAtFormatted;
  String? _previousScannedByName;

  int _successCount = 0;
  int _failedCount = 0;

  bool _isTorchOn = false;
  bool _isProcessing = false;
  String _lastScannedToken = '';
  DateTime _lastScanTime = DateTime.now().subtract(const Duration(seconds: 10));

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _resetTimer?.cancel();
    _laserController.dispose();
    _cameraController.dispose();
    super.dispose();
  }

  /// تحويل التاريخ والتوقيت إلى صيغة عربية سهلة القراءة بالتوقيت المحلي
  String _formatArabicDateTime(String? dateStr) {
    if (dateStr == null || dateStr.trim().isEmpty) return '';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      final hour = dt.hour;
      final minute = dt.minute.toString().padLeft(2, '0');
      final period = hour >= 12 ? 'مساءً' : 'صباحاً';
      final formattedHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      final timeStr = '$formattedHour:$minute $period';

      final now = DateTime.now();
      if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
        return 'اليوم - الساعة $timeStr';
      } else {
        final yesterday = now.subtract(const Duration(days: 1));
        if (dt.year == yesterday.year && dt.month == yesterday.month && dt.day == yesterday.day) {
          return 'أمس - الساعة $timeStr';
        } else {
          final datePart = '${dt.year}/${dt.month.toString().padLeft(2, '0')}/${dt.day.toString().padLeft(2, '0')}';
          return '$datePart - الساعة $timeStr';
        }
      }
    } catch (e) {
      return dateStr;
    }
  }

  /// إعادة تعيين الشاشة لحالة الاستعداد المحايدة
  void _resetToIdle() {
    if (!mounted) return;
    _resetTimer?.cancel();
    setState(() {
      _status = ScanStatus.idle;
      _statusTitle = 'جاهز للمسح وبانتظار رمز جديد';
      _statusSub = 'وجّه الكاميرا نحو رمز QR على بطاقة الضيف';
      _previousUsedAtFormatted = null;
      _previousScannedByName = null;
    });
  }

  /// جدولة إعادة التعيين التلقائي بعد مدة محددة
  void _scheduleAutoReset(int milliseconds) {
    _resetTimer?.cancel();
    _resetTimer = Timer(Duration(milliseconds: milliseconds), () {
      if (mounted && _status != ScanStatus.processing) {
        _resetToIdle();
      }
    });
  }

  /// معالجة التقاط الباركود من الكاميرا
  void _handleBarcode(BarcodeCapture capture) {
    // إذا كان هناك فحص جارٍ حالياً ننتظر اكتماله
    if (_isProcessing) return;

    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final rawValue = barcodes.first.rawValue?.trim() ?? '';
    if (rawValue.isEmpty) return;

    final now = DateTime.now();

    // حماية فقط من تكرار مسح نفس الباركود في نفس اللحظة (2.5 ثانية)
    if (rawValue == _lastScannedToken && now.difference(_lastScanTime).inMilliseconds < 2500) {
      return;
    }

    // إذا كان باركود جديد ومختلف، أو مر وقت كافٍ -> نمسحه فوراً دون أي تعطيل!
    _lastScannedToken = rawValue;
    _lastScanTime = now;
    _isProcessing = true;
    _resetTimer?.cancel();

    _verifyToken(rawValue);
  }

  /// التحقق من الباركود عبر استدعاء دالة السيرفر الذرية
  Future<void> _verifyToken(String token) async {
    _resetTimer?.cancel();

    setState(() {
      _isProcessing = true;
      _status = ScanStatus.processing;
      _statusTitle = 'جارٍ الفحص والتحقق...';
      _statusSub = 'الرمز: $token';
      _previousUsedAtFormatted = null;
      _previousScannedByName = null;
    });

    try {
      final eventId = widget.event['id'];
      final employeeName = widget.currentUser?['full_name'] ?? 'موظف البوابة';

      final response = await supabase.rpc(
        'check_in_atomic',
        params: {
          'p_token': token,
          'p_event_id': eventId,
          'p_device_name': 'جوال البوابة',
          'p_scanned_by': employeeName,
        },
      );

      final Map<String, dynamic> data = Map<String, dynamic>.from(response);
      final bool isSuccess = data['success'] == true;
      final String resultType = data['result'] ?? '';
      final String message = data['message'] ?? '';
      final String? guestName = data['guestName'];
      final dynamic invNumber = data['invitationNumber'];
      final dynamic previousUsedAt = data['previousUsedAt'] ?? data['used_at'];
      final String? scannedBy = data['scannedBy'];

      if (isSuccess) {
        // اهتزاز خفيف لنجاح العملية
        HapticFeedback.lightImpact();
        setState(() {
          _successCount++;
          _status = ScanStatus.success;
          _statusTitle = 'تم قبول الدخول بنجاح! ✓';
          _statusSub = guestName != null && guestName.isNotEmpty
              ? 'الضيف: $guestName (دعوة #${invNumber ?? '—'})'
              : 'دعوة رقم: #${invNumber ?? '—'} - أهلاً وسهلاً';
          _previousUsedAtFormatted = null;
          _previousScannedByName = null;
        });

        // عودة تلقائية لوضع الاستعداد بعد 2.5 ثانية
        _scheduleAutoReset(2500);
      } else {
        // اهتزاز قوي للتنبيه برفض التذكرة
        HapticFeedback.heavyImpact();
        setState(() {
          _failedCount++;
          _status = ScanStatus.failed;

          if (resultType == 'ALREADY_USED') {
            _statusTitle = '⚠️ تذكرة مستخدمة مسبقاً!';
            final timeStr = _formatArabicDateTime(previousUsedAt?.toString());
            _previousUsedAtFormatted = timeStr.isNotEmpty ? timeStr : 'غير مسجل';
            _previousScannedByName = (scannedBy != null && scannedBy.isNotEmpty) ? scannedBy : null;

            final nameStr = guestName != null && guestName.isNotEmpty
                ? 'الاسم: $guestName'
                : 'تم الدخول بها سابقاً';
            final invStr = invNumber != null ? ' (دعوة #$invNumber)' : '';
            _statusSub = '$nameStr$invStr';
          } else if (resultType == 'WRONG_EVENT') {
            _statusTitle = '🚫 تابعة لمناسبة أخرى!';
            _statusSub = message.isNotEmpty ? message : 'هذه الدعوة مخصصة لمناسبة أخرى';
            _previousUsedAtFormatted = null;
            _previousScannedByName = null;
          } else {
            _statusTitle = '❌ رمز غير صالح!';
            _statusSub = message.isNotEmpty ? message : 'رمز الدعوة غير مسجل بالنظام';
            _previousUsedAtFormatted = null;
            _previousScannedByName = null;
          }
        });

        // عودة تلقائية لوضع الاستعداد بعد 3.5 ثوانٍ للنتائج المرفوضة
        _scheduleAutoReset(3500);
      }
    } catch (err) {
      HapticFeedback.heavyImpact();
      setState(() {
        _failedCount++;
        _status = ScanStatus.failed;
        _statusTitle = 'خطأ في الاتصال بالشبكة';
        _statusSub = 'تأكد من اتصال الإنترنت وحاول مجدداً';
        _previousUsedAtFormatted = null;
      });
      _scheduleAutoReset(3000);
    } finally {
      // إتاحة مسح الباركود التالي فوراً بمجرد انتهاء الطلب بفاصل أمان 350ms فقط
      Future.delayed(const Duration(milliseconds: 350), () {
        if (mounted) {
          setState(() {
            _isProcessing = false;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final eventName = widget.event['name'] ?? 'المناسبة';

    Color statusBg;
    Color statusBorder;
    Color statusTextColor;
    IconData statusIcon;

    switch (_status) {
      case ScanStatus.success:
        statusBg = const Color(0xFF064E3B);
        statusBorder = const Color(0xFF10B981);
        statusTextColor = const Color(0xFF6EE7B7);
        statusIcon = Icons.check_circle_rounded;
        break;
      case ScanStatus.failed:
        statusBg = const Color(0xFF7F1D1D);
        statusBorder = const Color(0xFFEF4444);
        statusTextColor = const Color(0xFFFCA5A5);
        statusIcon = _previousUsedAtFormatted != null
            ? Icons.warning_amber_rounded
            : Icons.cancel_rounded;
        break;
      case ScanStatus.processing:
        statusBg = const Color(0xFF1E3A8A);
        statusBorder = const Color(0xFF3B82F6);
        statusTextColor = const Color(0xFF93C5FD);
        statusIcon = Icons.hourglass_top_rounded;
        break;
      case ScanStatus.idle:
        statusBg = const Color(0xFF1E293B);
        statusBorder = const Color(0xFF334155);
        statusTextColor = Colors.white70;
        statusIcon = Icons.qr_code_scanner_rounded;
        break;
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          eventName,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: Icon(_isTorchOn ? Icons.flash_on : Icons.flash_off),
            color: _isTorchOn ? Colors.amber : Colors.white70,
            onPressed: () async {
              await _cameraController.toggleTorch();
              setState(() {
                _isTorchOn = !_isTorchOn;
              });
            },
            tooltip: 'الفلاش',
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => _cameraController.switchCamera(),
            tooltip: 'تبديل الكاميرا',
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Column(
            children: [
              // 1. مربع الكاميرا مع مؤشر الليزر الحي وشارة الحالة
              Expanded(
                flex: 5,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: _status == ScanStatus.success
                          ? const Color(0xFF10B981)
                          : (_status == ScanStatus.failed
                              ? const Color(0xFFEF4444)
                              : const Color(0xFF334155)),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      MobileScanner(
                        controller: _cameraController,
                        onDetect: _handleBarcode,
                      ),

                      // إطار مربع التحديد مع خط الليزر المتحرك
                      Container(
                        width: 230,
                        height: 230,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _status == ScanStatus.success
                                ? const Color(0xFF10B981)
                                : (_status == ScanStatus.failed
                                    ? const Color(0xFFEF4444)
                                    : (_status == ScanStatus.processing
                                        ? const Color(0xFF3B82F6)
                                        : const Color(0xFF38BDF8))),
                            width: 2.5,
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(18),
                          child: Stack(
                            children: [
                              // خط الليزر المتحرك أثناء وضع الانتظار
                              if (_status == ScanStatus.idle)
                                AnimatedBuilder(
                                  animation: _laserController,
                                  builder: (context, child) {
                                    return Positioned(
                                      top: _laserController.value * 215,
                                      left: 0,
                                      right: 0,
                                      child: Container(
                                        height: 3.5,
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [
                                              Colors.transparent,
                                              Color(0xFF38BDF8),
                                              Colors.cyanAccent,
                                              Color(0xFF38BDF8),
                                              Colors.transparent,
                                            ],
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF38BDF8).withValues(alpha: 0.8),
                                              blurRadius: 8,
                                              spreadRadius: 2,
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),

                              // أيقونة جاري الفحص في المنتصف
                              if (_status == ScanStatus.processing)
                                const Center(
                                  child: CircularProgressIndicator(
                                    color: Color(0xFF38BDF8),
                                    strokeWidth: 3.5,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),

                      // شارة الحالة العلوية داخل الكاميرا (توضح للمنظم وضع الكاميرا فوراً)
                      Positioned(
                        top: 14,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.8),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _status == ScanStatus.success
                                  ? const Color(0xFF10B981)
                                  : (_status == ScanStatus.failed
                                      ? const Color(0xFFEF4444)
                                      : (_status == ScanStatus.processing
                                          ? const Color(0xFF3B82F6)
                                          : const Color(0xFF10B981))),
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.4),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _status == ScanStatus.success
                                      ? const Color(0xFF10B981)
                                      : (_status == ScanStatus.failed
                                          ? const Color(0xFFEF4444)
                                          : (_status == ScanStatus.processing
                                              ? const Color(0xFF3B82F6)
                                              : const Color(0xFF10B981))),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _status == ScanStatus.idle
                                    ? 'الكاميرا نشطة - بانتظار باركود...'
                                    : (_status == ScanStatus.processing
                                        ? 'جارٍ فحص التذكرة...'
                                        : (_status == ScanStatus.success
                                            ? 'تم القبول ✓'
                                            : (_previousUsedAtFormatted != null
                                                ? 'مستخدمة مسبقاً ⚠️'
                                                : 'مرفوض ✕'))),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // 2. مستطيل حالة المسح (مع وقت الاستخدام السابق وإمكانية النقر للعودة)
              InkWell(
                onTap: _status != ScanStatus.idle && _status != ScanStatus.processing
                    ? _resetToIdle
                    : null,
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: statusBorder, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: statusBorder.withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(statusIcon, color: statusBorder, size: 36),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _statusTitle,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  _statusSub,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: statusTextColor,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // عرض وقت وتاريخ الاستخدام السابق واسم الموظف الذي قام بالمسح
                      if (_previousUsedAtFormatted != null || _previousScannedByName != null) ...[
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: Colors.amber.withValues(alpha: 0.4),
                              width: 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_previousUsedAtFormatted != null)
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.access_time_filled,
                                      size: 16,
                                      color: Colors.amberAccent,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          style: const TextStyle(fontSize: 13, fontFamily: 'Cairo'),
                                          children: [
                                            const TextSpan(
                                              text: 'وقت الدخول السابق: ',
                                              style: TextStyle(
                                                color: Colors.white70,
                                                fontWeight: FontWeight.normal,
                                              ),
                                            ),
                                            TextSpan(
                                              text: _previousUsedAtFormatted!,
                                              style: const TextStyle(
                                                color: Colors.amberAccent,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              if (_previousScannedByName != null) ...[
                                const SizedBox(height: 5),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.person_pin_rounded,
                                      size: 16,
                                      color: Colors.amberAccent,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          style: const TextStyle(fontSize: 13, fontFamily: 'Cairo'),
                                          children: [
                                            const TextSpan(
                                              text: 'مُسح مسبقاً بواسطة: ',
                                              style: TextStyle(
                                                color: Colors.white70,
                                                fontWeight: FontWeight.normal,
                                              ),
                                            ),
                                            TextSpan(
                                              text: _previousScannedByName!,
                                              style: const TextStyle(
                                                color: Colors.amberAccent,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],

                      // إشارة العودة التلقائية لوضع الاستعداد
                      if (_status != ScanStatus.idle && _status != ScanStatus.processing) ...[
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _status == ScanStatus.success
                                  ? 'جاهز للمسح التالي تلقائياً...'
                                  : 'سيعود لوضع الاستعداد تلقائياً...',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.white54,
                              ),
                            ),
                            const Text(
                              'اضغط للمسح الفوري ⚡',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.white70,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // 3. المربع المقسوم من النص في الأسفل (عمليات ناجحة يمين، فاشلة يسار)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFF334155), width: 1.2),
                ),
                child: Row(
                  children: [
                    // اليمين: العمليات الناجحة
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF064E3B).withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFF10B981).withValues(alpha: 0.3),
                          ),
                        ),
                        child: Column(
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_outline, size: 16, color: Color(0xFF10B981)),
                                SizedBox(width: 6),
                                Text(
                                  'العمليات الناجحة',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF6EE7B7),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_successCount',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF10B981),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(width: 12),

                    // اليسار: العمليات الفاشلة
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7F1D1D).withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFFEF4444).withValues(alpha: 0.3),
                          ),
                        ),
                        child: Column(
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.highlight_off, size: 16, color: Color(0xFFEF4444)),
                                SizedBox(width: 6),
                                Text(
                                  'العمليات الفاشلة',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFFFCA5A5),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_failedCount',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFEF4444),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
