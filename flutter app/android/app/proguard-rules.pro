-keepattributes *Annotation*
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**
-keepclasseswithmembers class * {
    public void onPayment*(...);
}
