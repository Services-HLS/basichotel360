const { pool } = require("../config/database");

class Collection {
  // Get collections with filters
  static async getCollections(hotelId, filters = {}) {
    const {
      startDate,
      endDate,
      paymentMode = "all",
      handoverStatus = "all",
      limit = 100,
      offset = 0,
      search = "",
    } = filters;

    console.log("📊 [Collections] hotelId:", hotelId, "filters:", filters);

    try {
      const results = [];
      const searchTerm = search ? `%${search}%` : null;

      // ── PART 1: ALL entries from collections table ───────────────────────
      {
        let cashQuery = `
          SELECT 
            c.id,
            c.booking_id,
            c.collection_date,
            c.payment_mode,
            c.amount,
            c.transaction_id,
            c.remarks,
            c.collected_by,
            c.handover_status,
            c.handover_amount,
            c.handover_date,
            c.handover_to,
            c.handover_remarks,
            c.created_at,
            COALESCE(cust.name, 'Walk-in Customer') as customer_name,
            cust.phone as customer_phone,
            r.room_number,
            u.name as collected_by_user_name,
            b.total as booking_total,
            b.payment_method as booking_payment_method,
            b.payment_status as booking_payment_status,
            'collections' as source
          FROM collections c
          LEFT JOIN bookings b ON c.booking_id = b.id AND b.hotel_id = c.hotel_id
          LEFT JOIN customers cust ON b.customer_id = cust.id
          LEFT JOIN rooms r ON b.room_id = r.id
          LEFT JOIN users u ON c.collected_by = u.id
          WHERE c.hotel_id = ?
        `;
        const cashParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          cashQuery += ` AND c.collection_date BETWEEN ? AND ?`;
          cashParams.push(startDate, endDate);
        }

        if (paymentMode && paymentMode !== "all" && paymentMode !== "online") {
          cashQuery += ` AND c.payment_mode = ?`;
          cashParams.push(paymentMode);
        } else if (paymentMode === "online") {
          // Card 2 (Online) logic provided by user excludes collections table
          cashQuery += ` AND 1=0`;
        } else {
          // For 'all' or default, only show relevant modes that match the scorecard's net amount
          cashQuery += ` AND c.payment_mode = 'cash'`;
        }

        if (handoverStatus && handoverStatus !== "all") {
          if (handoverStatus === 'handed_over') {
            cashQuery += ` AND (c.handover_status = 'handed_over' OR c.handover_status = 'partially_handed_over')`;
          } else if (handoverStatus === 'pending') {
            cashQuery += ` AND (c.handover_status = 'pending' OR c.handover_status = 'partially_handed_over')`;
          } else {
            cashQuery += ` AND c.handover_status = ?`;
            cashParams.push(handoverStatus);
          }
        }

        if (searchTerm) {
          cashQuery += ` AND (cust.name LIKE ? OR r.room_number LIKE ? OR c.transaction_id LIKE ?)`;
          cashParams.push(searchTerm, searchTerm, searchTerm);
        }

        const [cashRows] = await pool.execute(cashQuery, cashParams);
        results.push(...cashRows);
      }

      // ── PART 2: Gateway ONLINE from transactions table ───────────────────
      if (paymentMode === "all" || paymentMode === "online") {
        let onlineQuery = `
          SELECT 
            t.id,
            t.booking_id,
            DATE(t.created_at) as collection_date,
            t.payment_method as payment_mode,
            t.amount,
            t.transaction_id,
            CONCAT('Online payment - TXN: ', COALESCE(t.transaction_id, t.id)) as remarks,
            NULL as collected_by,
            'not_applicable' as handover_status,
            0 as handover_amount,
            NULL as handover_date,
            NULL as handover_to,
            '' as handover_remarks,
            t.created_at,
            COALESCE(c.name, 'Online Customer') as customer_name,
            c.phone as customer_phone,
            r.room_number,
            'System (Online)' as collected_by_user_name,
            b.total as booking_total,
            b.payment_method as booking_payment_method,
            b.payment_status as booking_payment_status,
            'transactions' as source
          FROM transactions t
          LEFT JOIN bookings b ON t.booking_id = b.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN rooms r ON b.room_id = r.id
          WHERE t.hotel_id = ?
            AND t.payment_method <> 'cash'
        `;
        const onlineParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          onlineQuery += ` AND DATE(t.created_at) BETWEEN ? AND ?`;
          onlineParams.push(startDate, endDate);
        }

        if (searchTerm) {
          onlineQuery += ` AND (c.name LIKE ? OR r.room_number LIKE ? OR t.transaction_id LIKE ?)`;
          onlineParams.push(searchTerm, searchTerm, searchTerm);
        }

        const [onlineRows] = await pool.execute(onlineQuery, onlineParams);
        results.push(...onlineRows);
      }

      // ── PART 3: Advance Bookings (ONLY show Cash in list if it matches Card 1) ──
      {
        let advanceQuery = `
          SELECT 
            CONCAT('ADV-', ab.id) as id,
            ab.id as advance_booking_id,
            ab.booking_id,
            DATE(ab.created_at) as collection_date,
            ab.payment_method as payment_mode,
            ab.advance_amount as amount,
            ab.transaction_id,
            CONCAT('Advance booking for ', COALESCE(ab.purpose_of_visit, 'Room Booking')) as remarks,
            ab.created_by as collected_by,
            'pending' as handover_status,
            0 as handover_amount,
            NULL as handover_date,
            NULL as handover_to,
            '' as handover_remarks,
            ab.created_at,
            COALESCE(c.name, 'Advance Customer') as customer_name,
            c.phone as customer_phone,
            r.room_number,
            u.name as collected_by_user_name,
            ab.total as booking_total,
            ab.payment_method as booking_payment_method,
            ab.payment_status as booking_payment_status,
            'advance_bookings' as source
          FROM advance_bookings ab
          LEFT JOIN customers c ON ab.customer_id = c.id
          LEFT JOIN rooms r ON ab.room_id = r.id
          LEFT JOIN users u ON ab.created_by = u.id
          WHERE ab.hotel_id = ?
            AND ab.advance_amount > 0
            AND ab.payment_method = 'cash'
            AND ab.status <> 'converted'
        `;
        const advanceParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          advanceQuery += ` AND DATE(ab.created_at) BETWEEN ? AND ?`;
          advanceParams.push(startDate, endDate);
        }

        if (paymentMode && paymentMode !== "all" && paymentMode !== 'cash') {
          // If we are looking for online, skip advance bookings based on user's new Card 2 query
          advanceQuery += " AND 1=0";
        }

        if (searchTerm) {
          advanceQuery += ` AND (c.name LIKE ? OR r.room_number LIKE ? OR ab.transaction_id LIKE ?)`;
          advanceParams.push(searchTerm, searchTerm, searchTerm);
        }

        const [advanceRows] = await pool.execute(advanceQuery, advanceParams);

        const mappedAdvanceRows = advanceRows.map((row) => ({
          ...row,
          id: "adv_" + row.advance_booking_id,
        }));
        results.push(...mappedAdvanceRows);
      }

      // ── PART 4: Function Booking Amounts ────────────────────────────
      {
        let functionAmountQuery = `
          SELECT 
            CONCAT('FBA-', fba.id) as id,
            fba.function_booking_id as booking_id,
            DATE(fba.created_at) as collection_date,
            fba.payment_method as payment_mode,
            fba.transaction_amount as amount,
            fba.transaction_reference as transaction_id,
            fba.description as remarks,
            fba.created_by as collected_by,
            'pending' as handover_status,
            0 as handover_amount,
            NULL as handover_date,
            NULL as handover_to,
            '' as handover_remarks,
            fba.created_at,
            COALESCE(fb.customer_name, 'Function Customer') as customer_name,
            fb.customer_phone,
            fr.room_number,
            u.name as collected_by_user_name,
            fb.total_amount as booking_total,
            fb.payment_method as booking_payment_method,
            fb.payment_status as booking_payment_status,
            'function_booking_amounts' as source
          FROM function_booking_amounts fba
          LEFT JOIN function_bookings fb ON fba.function_booking_id = fb.id
          LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
          LEFT JOIN users u ON fba.created_by = u.id
          WHERE fba.hotel_id = ?
            AND fba.transaction_type IN ('advance', 'payment', 'final_payment')
        `;
        const functionAmountParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          functionAmountQuery += ` AND DATE(fba.created_at) BETWEEN ? AND ?`;
          functionAmountParams.push(startDate, endDate);
        }

        if (paymentMode && paymentMode !== "all") {
          if (paymentMode === "online") {
            functionAmountQuery += ` AND fba.payment_method = 'online'`;
          } else {
            functionAmountQuery += ` AND fba.payment_method = ?`;
            functionAmountParams.push(paymentMode);
          }
        }

        if (searchTerm) {
          functionAmountQuery += ` AND (fb.customer_name LIKE ? OR fr.room_number LIKE ? OR fba.transaction_reference LIKE ?)`;
          functionAmountParams.push(searchTerm, searchTerm, searchTerm);
        }

        const [functionAmountRows] = await pool.execute(functionAmountQuery, functionAmountParams);

        const mappedFunctionAmountRows = functionAmountRows.map((row) => ({
          ...row,
          id: "fba_" + row.id.split('-')[1],
        }));
        results.push(...mappedFunctionAmountRows);
      }

      // ── PART 6: All Booking Refunds (SUBTRACTION) ────────────────────
      {
        let refundQuery = `
          SELECT 
            CONCAT('fbr_', fbr.id) as id,
            fbr.booking_id as booking_id,
            DATE(fbr.created_at) as collection_date,
            fbr.refund_method as payment_mode,
            -fbr.refund_amount as amount,
            fbr.transaction_id,
            CONCAT('REFUND #', fbr.id, ': ', fbr.refund_reason) as remarks,
            fbr.processed_by as collected_by,
            'not_applicable' as handover_status,
            0 as handover_amount,
            NULL as handover_date,
            NULL as handover_to,
            '' as handover_remarks,
            fbr.created_at,
            COALESCE(fb.customer_name, cust.name, 'Refund Recipient') as customer_name,
            COALESCE(fb.customer_phone, cust.phone) as customer_phone,
            COALESCE(fr.room_number, r.room_number) as room_number,
            u.name as collected_by_user_name,
            COALESCE(fb.total_amount, b.total) as booking_total,
            COALESCE(fb.payment_method, b.payment_method) as booking_payment_method,
            COALESCE(fb.payment_status, b.payment_status) as booking_payment_status,
            'booking_refunds' as source
          FROM booking_refunds fbr
          LEFT JOIN function_bookings fb ON fbr.booking_id = fb.id AND fbr.booking_type = 'function'
          LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
          LEFT JOIN bookings b ON fbr.booking_id = b.id AND fbr.booking_type = 'room'
          LEFT JOIN customers cust ON b.customer_id = cust.id
          LEFT JOIN rooms r ON b.room_id = r.id
          LEFT JOIN users u ON fbr.processed_by = u.id
          WHERE fbr.hotel_id = ?
            AND fbr.refund_status = 'completed'
        `;
        const refundParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          refundQuery += ` AND DATE(fbr.created_at) BETWEEN ? AND ?`;
          refundParams.push(startDate, endDate);
        }

        if (paymentMode && paymentMode !== "all") {
          if (paymentMode === "online") {
            refundQuery += ` AND fbr.refund_method = 'online'`;
          } else {
            refundQuery += ` AND fbr.refund_method = ?`;
            refundParams.push(paymentMode);
          }
        }

        if (searchTerm) {
          refundQuery += ` AND (fb.customer_name LIKE ? OR fbr.refund_reason LIKE ?)`;
          refundParams.push(searchTerm, searchTerm);
        }

        const [refundRows] = await pool.execute(refundQuery, refundParams);
        results.push(...refundRows);
      }

      // Exclude zero-amount records from list to prevent clutter
      const nonZeroResults = results.filter(row => parseFloat(row.amount) !== 0);

      // Sort combined results by created_at DESC
      nonZeroResults.sort((a, b) => {
        const dateA = new Date(a.created_at || a.collection_date);
        const dateB = new Date(b.created_at || b.collection_date);
        return dateB - dateA;
      });

      // Apply pagination manually on combined result
      const pageLimit = parseInt(limit) || 100;
      const pageOffset = parseInt(offset) || 0;
      const paginated = nonZeroResults.slice(pageOffset, pageOffset + pageLimit);

      // Format for frontend
      const formattedCollections = paginated.map((row) => ({
        id: row.id,
        booking_id: row.booking_id || null,
        guest_name: row.customer_name || "Walk-in Customer",
        room_number: row.room_number || "N/A",
        collection_date: row.collection_date,
        payment_mode: row.payment_mode,
        amount: parseFloat(row.amount) || 0,
        transaction_id: row.transaction_id || null,
        remarks: row.remarks || "",
        collected_by: row.collected_by,
        collected_by_name: row.collected_by_user_name || "Staff",
        handover_status: row.handover_status || "not_applicable",
        handover_amount: parseFloat(row.handover_amount) || 0,
        handover_date: row.handover_date || null,
        handover_to: row.handover_to || null,
        handover_remarks: row.handover_remarks || "",
        created_at: row.created_at,
        booking_total: parseFloat(row.booking_total) || 0,
        booking_payment_method: row.booking_payment_method || "cash",
        booking_payment_status: row.booking_payment_status || "pending",
        source: row.source || "collections",
      }));

      return {
        collections: formattedCollections,
        total: results.length,
      };
    } catch (error) {
      console.error("❌ [Collections] Error:", error.message);
      throw error;
    }
  }

  // Get collection summary for the 4 cards - UPDATED with advance bookings and function amounts
  static async getCollectionSummary(hotelId, startDate, endDate) {
    console.log("📊 [Summary] hotelId:", hotelId, "dates:", {
      startDate,
      endDate,
    });

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let unifiedCashQuery = `
        SELECT SUM(cash_amount) AS total_cash_collection
        FROM (
            -- Advance Bookings
            SELECT COALESCE(SUM(advance_amount), 0) AS cash_amount
            FROM advance_bookings
            WHERE hotel_id = ? AND payment_method = 'cash'
           ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}

           
            UNION ALL

            -- Collections
            SELECT COALESCE(SUM(amount), 0) AS cash_amount
            FROM collections
            WHERE hotel_id = ? AND payment_mode = 'cash'
            ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}


            UNION ALL

            -- Function Booking Amounts (Transaction Amount)
            SELECT COALESCE(SUM(transaction_amount), 0) AS cash_amount
            FROM function_booking_amounts
            WHERE hotel_id = ? AND payment_method = 'cash'
            ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}


            UNION ALL

            -- Function Booking Refunds (Subtracting Refund Amount)
            SELECT -COALESCE(SUM(refund_amount), 0) AS cash_amount
            FROM booking_refunds
            WHERE hotel_id = ? AND refund_method = 'cash' AND refund_status = 'completed'
            ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}

        ) AS cash_summary
      `;

      // Lifetime total using EXACTLY the user's requested query (no filters)
      const lifetimeCashQuery = unifiedCashQuery;
      const hasDateFilter =
        startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "";

      const unifiedCashParams = [];
      for (let i = 0; i < 4; i++) {
        unifiedCashParams.push(hotelId);
        if (hasDateFilter) {
          unifiedCashParams.push(startDate, endDate);
        }
      }
      const lifetimeParams = [hotelId, hotelId, hotelId, hotelId];

      // ── 2. Handover Info (From the new cash_handovers table) ──────
      let handoverQuery = `
        SELECT 
           COALESCE(SUM(handover_amount), 0) as total_handed_over_lifetime,
           COALESCE(SUM(CASE
               WHEN ? != '' AND ? != '' AND DATE(handover_date) BETWEEN ? AND ? 
               THEN handover_amount ELSE 0 
           END), 0) as range_handed_over
        FROM cash_handovers
        WHERE hotel_id = ?
      `;
      const handoverParams = [
        startDate || '', endDate || '',
        startDate || '', endDate || '',
        hotelId
      ];

      // ── 3. Unified Online Collection (User Requested) ──────────────
      let unifiedOnlineQuery = `
        SELECT SUM(online_amount) AS total_online_collection
        FROM (
            -- Regular Transactions
            SELECT COALESCE(SUM(amount), 0) AS online_amount
            FROM transactions
            WHERE hotel_id = ? AND payment_method <> 'cash'
            ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}

            UNION ALL

            -- Function Booking Amounts (Transaction Amount)
            SELECT COALESCE(SUM(transaction_amount), 0) AS online_amount
            FROM function_booking_amounts
            WHERE hotel_id = ? AND payment_method = 'online'
            ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}

            UNION ALL

            -- Function Booking Refunds (Subtracting Refund Amount)
            SELECT -COALESCE(SUM(refund_amount), 0) AS online_amount
            FROM booking_refunds
            WHERE hotel_id = ? AND refund_method = 'online' AND refund_status = 'completed'
            ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}
        ) AS online_summary
      `;

      const unifiedOnlineParams = [];
      for (let i = 0; i < 3; i++) {
        unifiedOnlineParams.push(hotelId);
        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          unifiedOnlineParams.push(startDate, endDate);
        }
      }

      // breakdown queries
      const breakdownQuery = `
        SELECT
            'Advance Bookings' as source_name,
            COALESCE(SUM(advance_amount), 0) as source_amount
        FROM advance_bookings
        WHERE hotel_id = ? AND payment_method = 'cash' AND status <> 'converted'
        ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}
        
        UNION ALL
        
        SELECT
            'Regular Collections' as source_name,
            COALESCE(SUM(amount), 0) as source_amount
        FROM collections
        WHERE hotel_id = ? AND payment_mode = 'cash'
        ${startDate && endDate ? "AND collection_date BETWEEN ? AND ?" : ""}
        
        UNION ALL
        
        SELECT
            'Function Hall' as source_name,
            COALESCE(SUM(transaction_amount), 0) as source_amount
        FROM function_booking_amounts
        WHERE hotel_id = ? AND payment_method = 'cash' AND transaction_type IN ('advance', 'payment', 'final_payment')
        ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}
        
        UNION ALL
        
        SELECT
            'Refunds' as source_name,
            -COALESCE(SUM(refund_amount), 0) as source_amount
        FROM booking_refunds
        WHERE hotel_id = ? AND refund_method = 'cash' AND refund_status = 'completed'
        ${startDate && endDate ? "AND DATE(created_at) BETWEEN ? AND ?" : ""}
      `;

      const breakdownParams = [];
      for (let i = 0; i < 4; i++) {
        breakdownParams.push(hotelId);
        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          breakdownParams.push(startDate, endDate);
        }
      }

      // Execute all queries in parallel
      const [
        [unifiedCashRows],
        [handoverRows],
        [unifiedOnlineRows],
        [breakdownRows],
        [lifetimeCashRows],
      ] = await Promise.all([
        pool.execute(unifiedCashQuery, unifiedCashParams),
        pool.execute(handoverQuery, handoverParams),
        pool.execute(unifiedOnlineQuery, unifiedOnlineParams),
        pool.execute(breakdownQuery, breakdownParams),
        pool.execute(lifetimeCashQuery, hasDateFilter ? unifiedCashParams : lifetimeParams),
      ]);

      // Calculate all totals
      const cashAmountRange = parseFloat(unifiedCashRows[0]?.total_cash_collection) || 0;
      const todayReceipts = parseFloat(unifiedCashRows[0]?.today_cash_receipts) || 0;

      const lifetimeCash = parseFloat(lifetimeCashRows[0]?.total_cash_collection) || 0;
      const lifetimeHandover = parseFloat(handoverRows[0]?.total_handed_over_lifetime) || 0;
      const rangeHandover = parseFloat(handoverRows[0]?.range_handed_over) || 0;

      // True Pending Balance = All Receipts - All Settlements
      const pendingHandover = lifetimeCash - lifetimeHandover;

      // Previous Balance vs Today's (Logic requested for Handed tab)
      // Total Balance = the pending handover amount
      // Today's Collection = receipts from today
      // Previous Balance = the rest of the pending amount
      const previousBalance = pendingHandover - todayReceipts;

      // TOTAL ONLINE AMOUNT (Second Card) - From the unified query result
      const onlineAmount = parseFloat(unifiedOnlineRows[0]?.total_online_collection) || 0;

      // TOTAL AMOUNT (Third Card) - Represents filtered view
      const totalAmount = cashAmountRange + onlineAmount;

      // Percentages
      const cashPercentage = totalAmount > 0 ? (cashAmountRange / totalAmount) * 100 : 0;
      const onlinePercentage = totalAmount > 0 ? (onlineAmount / totalAmount) * 100 : 0;

      console.log("✅ [Summary] Results:", {
        cashAmountRange,
        todayReceipts,
        pendingHandover,
        previousBalance
      });

      return {
        total_cash: cashAmountRange,
        total_online: onlineAmount,
        total_amount: totalAmount,
        handed_over_cash: rangeHandover,
        pending_handover: pendingHandover,
        previous_balance: previousBalance,
        todays_collection: todayReceipts,
        cash_percentage: cashPercentage,
        online_percentage: onlinePercentage,
        breakdown: breakdownRows.map(row => ({
          name: row.source_name,
          amount: parseFloat(row.source_amount) || 0
        }))
      };
    } catch (error) {
      console.error("❌ [Summary] SQL Error:", error.message);
      return {
        total_cash: 0,
        total_online: 0,
        total_amount: 0,
        handed_over_cash: 0,
        pending_handover: 0,
        cash_percentage: 0,
        online_percentage: 0,
      };
    }
  }

  // Get cash bookings (for cash bookings tab) - UPDATED with advance bookings
  static async getCashBookings(hotelId, startDate, endDate) {
    console.log("💵 [Cash Bookings] Hotel:", hotelId);

    try {
      // We need to use UNION to combine regular bookings and advance bookings
      let query = `
        -- Regular bookings with pending cash
        SELECT 
          b.id as booking_id,
          DATE(b.created_at) as booking_date,
          b.total as booking_amount,
          b.payment_method,
          b.payment_status,
          COALESCE(c.name, 'Guest') as guest_name,
          r.room_number,
          COALESCE(SUM(col.amount), 0) as collected_amount,
          (b.total - COALESCE(SUM(col.amount), 0)) as pending_amount,
          'booking' as source_type
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN rooms r ON b.room_id = r.id
        LEFT JOIN collections col ON b.id = col.booking_id AND col.payment_mode = 'cash'
        WHERE b.hotel_id = ?
          AND b.payment_method = 'cash'
          AND b.status = 'booked'
          AND b.total > 0
      `;

      const params = [hotelId];

      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        query += ` AND DATE(b.created_at) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      query += ` GROUP BY b.id HAVING pending_amount > 0`;

      query += `
        UNION ALL
        
        -- Advance bookings with pending cash
        SELECT 
          ab.id as booking_id,
          DATE(ab.created_at) as booking_date,
          ab.total as booking_amount,
          ab.payment_method,
          ab.payment_status,
          COALESCE(c.name, 'Advance Guest') as guest_name,
          r.room_number,
          ab.advance_amount as collected_amount,
          (ab.total - ab.advance_amount) as pending_amount,
          'advance' as source_type
        FROM advance_bookings ab
        LEFT JOIN customers c ON ab.customer_id = c.id
        LEFT JOIN rooms r ON ab.room_id = r.id
        WHERE ab.hotel_id = ?
          AND ab.payment_method = 'cash'
          AND ab.status IN ('confirmed', 'pending')
          AND ab.advance_amount > 0
          AND ab.total > ab.advance_amount
      `;

      params.push(hotelId);

      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        query += ` AND DATE(ab.created_at) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      query += ` ORDER BY booking_date DESC`;

      console.log("💵 [Cash Bookings] Query:", query);
      console.log("💵 [Cash Bookings] Params:", params);

      const [rows] = await pool.execute(query, params);

      // Format the results
      const formattedRows = rows.map(row => ({
        ...row,
        booking_amount: parseFloat(row.booking_amount) || 0,
        collected_amount: parseFloat(row.collected_amount) || 0,
        pending_amount: parseFloat(row.pending_amount) || 0
      }));

      console.log("✅ [Cash Bookings] Found:", formattedRows.length);
      return formattedRows;
    } catch (error) {
      console.error("❌ [Cash Bookings] Error:", error.message);
      return [];
    }
  }

  // Create collection - (Keep as is, working version)
  static async create(collectionData) {
    console.log("📝 [Create Collection] Data:", collectionData);

    const query = `
      INSERT INTO collections (
        hotel_id, booking_id, collection_date, payment_mode,
        amount, transaction_id, remarks, collected_by,
        handover_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      collectionData.hotel_id,
      collectionData.booking_id || null,
      collectionData.collection_date || new Date().toISOString().split("T")[0],
      collectionData.payment_mode,
      collectionData.amount,
      collectionData.transaction_id || null,
      collectionData.remarks || "",
      collectionData.collected_by,
      collectionData.payment_mode === "cash" ? "pending" : "not_applicable",
      collectionData.created_by,
    ];

    try {
      const [result] = await pool.execute(query, params);
      console.log("✅ [Create Collection] Success! ID:", result.insertId);
      return result.insertId;
    } catch (error) {
      console.error("❌ [Create Collection] Error:", error.message);
      throw error;
    }
  }

  // Create collection from cash booking - (Keep as is)
  static async createFromCashBooking(bookingId, hotelId, userId) {
    console.log("💰 [Auto-Collection] Booking:", bookingId, "Hotel:", hotelId, "User:", userId);

    try {
      const [bookingRows] = await pool.execute(
        `
        SELECT 
          b.total,
          b.payment_method,
          b.payment_status,
          c.name as customer_name
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.id = ? AND b.hotel_id = ?
        `,
        [bookingId, hotelId],
      );

      if (bookingRows.length === 0) {
        console.log("❌ [Auto-Collection] Booking not found");
        return null;
      }

      const booking = bookingRows[0];

      const insertQuery = `
        INSERT INTO collections (
          hotel_id, booking_id, collection_date, payment_mode,
          amount, remarks, collected_by, handover_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        hotelId,
        bookingId,
        new Date().toISOString().split("T")[0],
        "cash",
        booking.total,
        `Auto-collection for booking #${bookingId} - ${booking.customer_name || "Guest"}`,
        userId,
        "pending",
        userId,
      ];

      const [result] = await pool.execute(insertQuery, insertParams);
      console.log("✅ [Auto-Collection] Created! ID:", result.insertId);
      return result.insertId;
    } catch (error) {
      console.error("❌ [Auto-Collection] Error:", error.message);
      return null;
    }
  }

  // Update handover status - (Keep as is)
  static async updateHandover(collectionId, hotelId, handoverData) {
    console.log("🔄 [Handover] Collection:", collectionId, "Data:", handoverData);

    // If the ID is from advance_bookings or function_booking_amounts, we create a new collection record
    if (typeof collectionId === 'string' && (collectionId.startsWith('adv_') || collectionId.startsWith('fba_'))) {
      try {
        const parts = collectionId.split('_');
        const source = parts[0]; // adv or fba
        const sourceId = parts[1];

        // Fetch original record details to create collection
        let amount = handoverData.amount;
        let remarks = handoverData.remarks || '';
        let bookingId = null;
        let paymentMode = 'cash';

        if (source === 'adv') {
          const [advRows] = await pool.execute('SELECT * FROM advance_bookings WHERE id = ? AND hotel_id = ?', [sourceId, hotelId]);
          if (advRows.length > 0) {
            bookingId = advRows[0].booking_id;
            remarks = `${remarks} (Handover for Advance Booking #${sourceId}) [ref:adv_${sourceId}]`;
          }
        } else if (source === 'fba') {
          const [fbaRows] = await pool.execute('SELECT * FROM function_booking_amounts WHERE id = ? AND hotel_id = ?', [sourceId, hotelId]);
          if (fbaRows.length > 0) {
            bookingId = fbaRows[0].function_booking_id;
            remarks = `${remarks} (Handover for Function Hall payment #${sourceId}) [ref:fba_${sourceId}]`;
          }
        }

        // Create a new record in collections table marked as handed over
        const query = `
          INSERT INTO collections (
            hotel_id, booking_id, collection_date, payment_mode,
            amount, handover_status, handover_amount, handover_date,
            handover_to, handover_remarks, remarks, created_by, collected_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          hotelId,
          bookingId,
          new Date().toISOString().split('T')[0],
          paymentMode,
          amount,
          'handed_over',
          amount,
          new Date().toISOString().split('T')[0],
          handoverData.handover_to || 'owner',
          handoverData.remarks || '',
          remarks,
          1, // default system user 
          1
        ];

        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
      } catch (error) {
        console.error("❌ [Handover] Extra source error:", error.message);
        return false;
      }
    }

    const query = `
      UPDATE collections 
      SET 
        handover_status = ?,
        handover_amount = ?,
        handover_date = ?,
        handover_to = ?,
        handover_remarks = ?
      WHERE id = ? AND hotel_id = ?
    `;

    const params = [
      handoverData.status,
      handoverData.amount,
      handoverData.handover_date || new Date().toISOString().split("T")[0],
      handoverData.handover_to,
      handoverData.remarks || "",
      collectionId,
      hotelId,
    ];

    try {
      const [result] = await pool.execute(query, params);
      console.log("✅ [Handover] Updated, affected rows:", result.affectedRows);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("❌ [Handover] Error:", error.message);
      throw error;
    }
  }

  // Bulk Handover - Updated implementation using the cash_handovers table
  static async bulkHandover(hotelId, handoverData) {
    console.log("🔄 [Bulk Handover] Hotel:", hotelId, "Data:", handoverData);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert into cash_handovers table
      const handoverQuery = `
        INSERT INTO cash_handovers (
          hotel_id, handover_amount, handover_date, handover_to, 
          handover_type, status, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Ensure receiverId is a valid user ID (fallback to current user if "owner" text is passed)
      const creatorId = parseInt(handoverData.user_id) || 62; // 62 is from your logs
      const receiverId = parseInt(handoverData.handover_to) || creatorId;

      const handoverParams = [
        hotelId,
        handoverData.amount,
        new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        receiverId,
        handoverData.handover_type || 'bulk',
        'completed',
        handoverData.remarks || 'Bulk Handover',
        creatorId
      ];

      const [handoverResult] = await connection.execute(handoverQuery, handoverParams);
      const handoverId = handoverResult.insertId;

      await connection.commit();
      return handoverId;
    } catch (error) {
      await connection.rollback();
      console.error("❌ [Bulk Handover] Error:", error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get Handover History (Ledger)
  static async getHandoverHistory(hotelId, filters = {}) {
    const { startDate, endDate } = filters;

    console.log("📜 [Handover History] Hotel:", hotelId, filters);

    try {
      let query = `
        SELECT 
          ch.*,
          u_to.name as handover_to_name,
          u_by.name as created_by_name
        FROM cash_handovers ch
        LEFT JOIN users u_to ON ch.handover_to = u_to.id
        LEFT JOIN users u_by ON ch.created_by = u_by.id
        WHERE ch.hotel_id = ?
      `;

      const params = [hotelId];

      if (startDate && endDate) {
        query += ` AND DATE(ch.handover_date) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      query += ` ORDER BY ch.handover_date DESC`;

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error("❌ [Handover History] Error:", error.message);
      throw error;
    }
  }

  // Get existing Handover Types (Dynamic List)
  static async getHandoverTypes(hotelId) {
    try {
      const [rows] = await pool.execute(
        `SELECT DISTINCT handover_type FROM cash_handovers WHERE hotel_id = ? AND handover_type IS NOT NULL`,
        [hotelId]
      );
      return rows.map(r => r.handover_type);
    } catch (error) {
      console.error("❌ [Handover Types] Error:", error.message);
      return ['cash', 'bank', 'upi'];
    }
  }

  // Get collection by ID - (Keep as is)
  static async getById(collectionId, hotelId) {
    try {
      console.log("🔍 [GetById] Collection:", collectionId, "Hotel:", hotelId);

      const query = `
        SELECT c.*
        FROM collections c
        WHERE c.id = ? AND c.hotel_id = ?
      `;

      const [rows] = await pool.execute(query, [collectionId, hotelId]);

      if (rows.length === 0) {
        console.log("❌ [GetById] Collection not found");
        return null;
      }

      console.log("✅ [GetById] Collection found");
      return rows[0];
    } catch (error) {
      console.error("❌ [GetById] Error:", error.message);
      return null;
    }
  }
}

module.exports = Collection;
