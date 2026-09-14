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
          secondary: Color(0xFF3B82F6),
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
      home: const EventsListScreen(),
    );
  }
}

// -----------------------------------------------------------------------------
// الشاشة الأولى: اختيار المناسبة
// -----------------------------------------------------------------------------
class EventsListScreen extends StatefulWidget {
  const EventsListScreen({super.key});

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
      final response = await supabase
          .from('events')
          .select('*')
          .order('id', ascending: false);

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
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'اختر المناسبة',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchEvents,
            tooltip: 'تحديث',
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
                        'لا توجد مناسبات حالياً في السحابة',
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
                                      builder: (_) => ScannerScreen(event: event),
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
// الشاشة الثانية: شاشة المسح (كاميرا فوق + مستطيل الحالة + العدادين تحت)
// -----------------------------------------------------------------------------
class ScannerScreen extends StatefulWidget {
  final Map<String, dynamic> event;

  const ScannerScreen({super.key, required this.event});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

enum ScanStatus { idle, success, failed, processing }

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _cameraController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  final supabase = Supabase.instance.client;

  ScanStatus _status = ScanStatus.idle;
  String _statusTitle = 'جاهز للمسح';
  String _statusSub = 'وجّه الكاميرا نحو رمز QR على بطاقة الضيف';
  
  int _successCount = 0;
  int _failedCount = 0;

  bool _isTorchOn = false;
  bool _isProcessing = false;
  String _lastScannedToken = '';
  DateTime _lastScanTime = DateTime.now();

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  void _handleBarcode(BarcodeCapture capture) {
    if (_isProcessing) return;

    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final rawValue = barcodes.first.rawValue?.trim() ?? '';
    if (rawValue.isEmpty) return;

    // تفادي المسح المتكرر في نفس اللحظة
    final now = DateTime.now();
    if (rawValue == _lastScannedToken && now.difference(_lastScanTime).inMilliseconds < 2500) {
      return;
    }

    _lastScannedToken = rawValue;
    _lastScanTime = now;

    _verifyToken(rawValue);
  }

  Future<void> _verifyToken(String token) async {
    setState(() {
      _isProcessing = true;
      _status = ScanStatus.processing;
      _statusTitle = 'جارٍ الفحص والتحقق...';
      _statusSub = token;
    });

    try {
      final eventId = widget.event['id'];

      // استدعاء دالة check_in_atomic عبر سوبابيس
      final response = await supabase.rpc(
        'check_in_atomic',
        params: {
          'p_token': token,
          'p_event_id': eventId,
          'p_device_name': 'جوال البوابة',
        },
      );

      final Map<String, dynamic> data = Map<String, dynamic>.from(response);
      final bool isSuccess = data['success'] == true;
      final String resultType = data['result'] ?? '';
      final String message = data['message'] ?? '';
      final String? guestName = data['guestName'];
      final dynamic invNumber = data['invitationNumber'];

      if (isSuccess) {
        // اهتزاز خفيف للنجاح
        HapticFeedback.lightImpact();
        setState(() {
          _successCount++;
          _status = ScanStatus.success;
          _statusTitle = 'تم قبول الدخول بنجاح! ✓';
          _statusSub = guestName != null && guestName.isNotEmpty
              ? 'الضيف: $guestName (دعوة #$invNumber)'
              : 'دعوة رقم: #$invNumber - أهلاً وسهلاً';
        });
      } else {
        // اهتزاز قوي للتنبيه بالفشل
        HapticFeedback.heavyImpact();
        setState(() {
          _failedCount++;
          _status = ScanStatus.failed;
          if (resultType == 'ALREADY_USED') {
            _statusTitle = '⚠️ تذكرة مستخدمة مسبقاً!';
            _statusSub = guestName != null
                ? 'الاسم: $guestName - تم الدخول بها سابقاً'
                : message;
          } else if (resultType == 'WRONG_EVENT') {
            _statusTitle = '🚫 تابعة لمناسبة أخرى!';
            _statusSub = message;
          } else {
            _statusTitle = '❌ رمز غير صالح!';
            _statusSub = message;
          }
        });
      }
    } catch (err) {
      HapticFeedback.heavyImpact();
      setState(() {
        _failedCount++;
        _status = ScanStatus.failed;
        _statusTitle = 'خطأ في الاتصال بالشبكة';
        _statusSub = 'تأكد من اتصال الإنترنت وحاول مجدداً';
      });
    } finally {
      // إتاحة المسح مجدداً بعد ثانية ونصف
      Future.delayed(const Duration(milliseconds: 1800), () {
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
        statusIcon = Icons.check_circle;
        break;
      case ScanStatus.failed:
        statusBg = const Color(0xFF7F1D1D);
        statusBorder = const Color(0xFFEF4444);
        statusTextColor = const Color(0xFFFCA5A5);
        statusIcon = Icons.cancel;
        break;
      case ScanStatus.processing:
        statusBg = const Color(0xFF1E3A8A);
        statusBorder = const Color(0xFF3B82F6);
        statusTextColor = const Color(0xFF93C5FD);
        statusIcon = Icons.sync;
        break;
      case ScanStatus.idle:
        statusBg = const Color(0xFF1E293B);
        statusBorder = const Color(0xFF334155);
        statusTextColor = Colors.white70;
        statusIcon = Icons.qr_code_scanner;
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
              // 1. مربع الكاميرا في الأعلى
              Expanded(
                flex: 5,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFF334155), width: 2),
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
                      // إطار مربع التحديد
                      Container(
                        width: 220,
                        height: 220,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _status == ScanStatus.success
                                ? const Color(0xFF10B981)
                                : (_status == ScanStatus.failed
                                    ? const Color(0xFFEF4444)
                                    : const Color(0xFF38BDF8)),
                            width: 2.5,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // 2. مستطيل حالة المسح في المنتصف
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: statusBorder, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: statusBorder.withValues(alpha: 0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
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
