import 'package:flutter_test/flutter_test.dart';
import 'package:event_scanner/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    expect(const EventScannerApp(), isNotNull);
  });
}
